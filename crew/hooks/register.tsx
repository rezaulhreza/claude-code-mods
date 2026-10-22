import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, StateDollar } from 'claude-code'

import type { AgentRow, FeedItem } from '../types'
import { COLUMNS, ROWS, avatarCells, hex, hueOf } from './avatar'
import { clip, describe, duration, noteOf, target } from './describe'

const PANE = 'crew'
const RED = '#F0776B'

const agents = atom({ plugin: 'crew', key: 'agents' } as const, [])
const feeds = atom({ plugin: 'crew', key: 'feeds' } as const, {})
const drafts = atom({ plugin: 'crew', key: 'drafts' } as const, {})
const tick = atom({ plugin: 'crew', key: 'tick' } as const, 0)

export const paneIdOf = (agentId: string) => `agent-${agentId.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 58)}`
const shortId = (agentId: string) => agentId.replace(/^agent-?/, '').slice(0, 4)
const modelName = (model: string) => /^claude-([a-z]+)/.exec(model)?.[1] ?? model

async function push($: StateDollar, agentId: string, item: FeedItem) {
  await update($, feeds, all => ({ ...all, [agentId]: [...(all[agentId] ?? []), item].slice(-200) }))
}

async function patch($: StateDollar, agentId: string, itemId: string, change: Partial<FeedItem>) {
  await update($, feeds, all => ({
    ...all,
    [agentId]: (all[agentId] ?? []).map(item => (item.id === itemId ? { ...item, ...change } : item)),
  }))
}

async function setAgent($: StateDollar, agentId: string, change: (agent: AgentRow) => Partial<AgentRow>) {
  await update($, agents, list => list.map(agent => (agent.id === agentId ? { ...agent, ...change(agent) } : agent)))
}

function openAgent($: EngineInterface, agent: AgentRow) {
  return $.ui.open({ id: paneIdOf(agent.id), title: `${agent.type} ${shortId(agent.id)}`, focus: true })
}

// Running agents first, newest first; then finished ones, newest first.
export function ordered(list: readonly AgentRow[]): AgentRow[] {
  const running = list.filter(agent => agent.status === 'running')
  const ended = list.filter(agent => agent.status !== 'running')

  return [...running, ...ended]
}

const glyphOf = (status: AgentRow['status']) => (status === 'running' ? '●' : status === 'done' ? '✓' : '✗')
const colourOf = (status: AgentRow['status'], accent: string) => (status === 'running' ? accent : status === 'failed' ? RED : undefined)
const elapsed = (agent: AgentRow, now: number) => duration((agent.endedAt ?? now) - agent.startedAt)

export const register: Register = (on, options) => {
  const ACCENT = String(options.accent || '#D97757')
  let cwd = ''
  let isFullscreen = false
  let seq = 0

  on('session.start', async ($, e, next) => {
    const started = await next(e)
    cwd = e.cwd
    await $.command.register({
      name: 'crew',
      description: 'Show the subagents pane; /crew <type, task or id> opens one agent',
    })

    // Redraw elapsed times every 5 s while an agent runs.
    $.clock.every(5000, () => {
      void (async () => {
        if ((await read($, agents)).some(agent => agent.status === 'running')) {
          await update($, tick, n => n + 1)
        }
      })()
    })

    return started
  })

  // The prompt hint is drawn in every layout: it tells us whether a pane would dock.
  on('ui.render', { component: 'PromptHint' }, ($, e, next) => {
    isFullscreen = e.viewport?.isFullscreen === true

    return next(e)
  })

  on('agent.spawn', async ($, e, next) => {
    const spawned = await next(e)

    if (spawned.deny !== undefined || !spawned.agentId) {
      return spawned
    }

    const row: AgentRow = {
      id: spawned.agentId,
      type: e.subagentType,
      task: e.description,
      model: modelName(spawned.model),
      status: 'running',
      startedAt: await $.clock.now(),
      endedAt: null,
      tools: 0,
      live: 'starting',
    }
    await update($, agents, list => [row, ...list.filter(agent => agent.id !== row.id)].slice(0, 50))

    if (isFullscreen && options.autoOpen !== 'command') {
      void $.ui.open({ id: PANE, title: 'Agents' })
    }

    return spawned
  }).catch(($, e, next) => next(e))

  on('turn.start', async ($, e, next) => {
    const agentId = e.agentId

    if (agentId) {
      const now = await $.clock.now()
      await setAgent($, agentId, agent =>
        agent.status === 'running' ? {} : { status: 'running', startedAt: now, endedAt: null, live: 'resumed' },
      )
    }

    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    const agentId = e.agentId

    if (!agentId) {
      return next(e)
    }

    seq += 1
    const input = e as Parameters<typeof describe>[0]
    const itemId = e.tool_use_id ?? `call-${seq}`
    const { verb, what } = target(input, cwd)
    const live = describe(input, cwd)
    await setAgent($, agentId, agent => ({ tools: agent.tools + 1, live: live[0]!.toLowerCase() + live.slice(1) }))
    await push($, agentId, { id: itemId, kind: 'tool', verb, text: what, state: 'running', note: '' })

    const ran = await next(e)
    const isError = ran.deny !== undefined || ran.isError === true
    await patch($, agentId, itemId, { state: isError ? 'error' : 'done', note: noteOf(e.tool, ran) })

    return ran
  }).catch(($, e, next) => next(e))

  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    const agentId = e.agentId

    if (agentId) {
      const isFailed = e.reason !== 'answer'
      const now = await $.clock.now()
      await setAgent($, agentId, () => ({
        status: isFailed ? 'failed' : 'done',
        endedAt: now,
        live: e.isAborted ? 'interrupted' : isFailed ? 'stopped on an error' : 'finished',
      }))

      if (e.answer.trim()) {
        await push($, agentId, { id: `answer-${e.turnId}`, kind: 'text', verb: '', text: clip3(e.answer), state: 'done', note: '' })
      }
    }

    return done
  })

  on('command.run', { command: 'crew' }, async ($, e) => {
    const query = e.args.trim().toLowerCase()

    if (!query) {
      await $.ui.open({ id: PANE, title: 'Agents' })

      return {}
    }

    const match = ordered(await read($, agents)).find(
      agent =>
        agent.id.toLowerCase().startsWith(query) ||
        agent.type.toLowerCase().startsWith(query) ||
        agent.task.toLowerCase().includes(query),
    )

    if (!match) {
      return { text: `No agent matches "${e.args.trim()}". Run /crew to see them all.` }
    }

    await openAgent($, match)

    return {}
  })

  // The crew pane: one block per agent.
  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const els = $.ui.resolve(e)
    const { Box, Button, Text } = els
    await read($, tick)
    const list = ordered(await read($, agents))
    const now = await $.clock.now()
    const running = list.filter(agent => agent.status === 'running').length
    const done = list.filter(agent => agent.status === 'done').length
    const failed = list.length - running - done
    const counts = [`${running} running`, `${done} done`, failed ? `${failed} failed` : ''].filter(Boolean).join(' · ')
    const tools = list.reduce((sum, agent) => sum + agent.tools, 0)
    const time = list.reduce((sum, agent) => sum + ((agent.endedAt ?? now) - agent.startedAt), 0)

    return (
      <Box flexDirection="column" gap={1}>
        <Text>
          <Text bold>Agents</Text>
          <Text dimColor>{list.length ? `  ${counts}` : '  none yet'}</Text>
        </Text>
        {list.map(agent => {
          const isRunning = agent.status === 'running'

          return (
            <Box key={`row-${agent.id}`} flexDirection="row" gap={2}>
              {'Raster' in els ? (
                <els.Raster key={`av-${agent.id}`} columns={COLUMNS} rows={ROWS} cells={avatarCells(agent.id, agent.type, !isRunning)} />
              ) : (
                <Text color={hex(hueOf(agent.type))}>■</Text>
              )}
              <Box flexDirection="column" flexGrow={1}>
                <Button key={`open-${agent.id}`} plain onPress={() => openAgent($ as EngineInterface, agent)}>
                  <Text color={colourOf(agent.status, ACCENT)} dimColor={agent.status === 'done'}>
                    {glyphOf(agent.status)}
                  </Text>{' '}
                  <Text dimColor={!isRunning}>{agent.type}</Text>
                  <Text dimColor>{`  ${elapsed(agent, now)}`}</Text>
                </Button>
                <Text dimColor={!isRunning} wrap="truncate-end">
                  {agent.task}
                </Text>
                <Text dimColor wrap="truncate-end">
                  {isRunning ? `${agent.model} · ${agent.tools} · ${agent.live}` : `${agent.model} · ${agent.tools} tools · ${agent.live}`}
                </Text>
              </Box>
            </Box>
          )
        })}
        {list.length > 0 && <Text dimColor>{`${tools} tools · ${duration(time)} agent time`}</Text>}
      </Box>
    )
  })

  // One agent's pane: header, live feed, message field.
  on('ui.render', { component: 'Pane' }, async ($, e, next) => {
    if (!e.requestId.startsWith('agent-')) {
      return next(e)
    }

    const agent = (await read($, agents)).find(one => paneIdOf(one.id) === e.requestId)

    if (!agent) {
      return next(e)
    }

    const els = $.ui.resolve(e)
    const { Box, Button, Text } = els
    await read($, tick)
    const now = await $.clock.now()
    const feed = (await read($, feeds))[agent.id] ?? []
    const draft = (await read($, drafts))[agent.id] ?? ''
    const hue = hex(hueOf(agent.type))
    const isRunning = agent.status === 'running'
    const room = Math.max(3, e.props.scroll.bodyRows - 9)
    const width = Math.max(10, e.props.bodyColumns)

    const send = async (value: string) => {
      const text = value.trim()

      if (!text) {
        return
      }

      seq += 1
      const itemId = `you-${seq}`
      await update($, drafts, all => ({ ...all, [agent.id]: '' }))
      await push($, agent.id, { id: itemId, kind: 'you', verb: 'you', text, state: 'running', note: 'sending' })
      const sent = await $.session.send({ to: { agentId: agent.id }, text })
      await patch(
        $,
        agent.id,
        itemId,
        sent.isDelivered ? { state: 'done', note: 'delivered' } : { state: 'error', note: clip(sent.reason, 60) },
      )
    }

    return (
      <Box flexDirection="column">
        <Box flexDirection="row" gap={2}>
          {'Raster' in els ? (
            <els.Raster key="avatar" columns={COLUMNS} rows={ROWS} cells={avatarCells(agent.id, agent.type, !isRunning)} />
          ) : (
            <Text color={hue}>■</Text>
          )}
          <Box flexDirection="column" flexGrow={1}>
            <Text wrap="truncate-end">
              <Text bold>{agent.type}</Text>
              {`  ${agent.task}`}
            </Text>
            <Text wrap="truncate-end">
              <Text color={colourOf(agent.status, ACCENT)} dimColor={agent.status === 'done'}>
                {glyphOf(agent.status)}
              </Text>
              <Text dimColor>{` ${agent.status} · ${elapsed(agent, now)} · ${agent.model} · ${agent.tools} tools`}</Text>
            </Text>
            <Button key="transcript" plain hotkey="v" onPress={() => $.ui.view({ agentId: agent.id })}>
              <Text dimColor>full transcript</Text>
            </Button>
          </Box>
        </Box>
        <Text dimColor>{'─'.repeat(width)}</Text>
        {feed.length === 0 && <Text dimColor>No activity yet.</Text>}
        {feed.slice(-room).map(item =>
          item.kind === 'text' ? (
            <Text color={hue}>{`⏺ ${item.text}`}</Text>
          ) : (
            <Text wrap="truncate-end">
              <Text color={item.kind === 'you' ? ACCENT : item.state === 'error' ? RED : item.state === 'running' ? ACCENT : undefined}>
                {item.kind === 'you' ? 'you' : item.state === 'running' ? '●' : item.state === 'error' ? '✗' : '✓'}
              </Text>
              {item.kind === 'you' ? '     ' : ` ${item.verb.padEnd(7)} `}
              <Text color={item.state === 'error' && item.kind === 'tool' ? RED : undefined}>{item.text}</Text>
              {item.note ? <Text dimColor>{`  ${item.note}`}</Text> : null}
            </Text>
          ),
        )}
        <Text dimColor>{'─'.repeat(width)}</Text>
        {'Input' in els ? (
          <els.Input
            key="message"
            label={`Message ${agent.type}`}
            placeholder={isRunning ? 'It reads this at its next step' : 'It resumes with this message'}
            value={draft}
            onInput={value => void update($, drafts, all => ({ ...all, [agent.id]: value }))}
            onSubmit={value => void send(value)}
          />
        ) : (
          <Text dimColor>Messages need a surface with text input.</Text>
        )}
      </Box>
    )
  })
}

// The first three lines of an answer, so the feed stays readable.
function clip3(text: string): string {
  const lines = text.trim().split('\n').filter(line => line.trim())
  const head = lines.slice(0, 3).join('\n')

  return lines.length > 3 ? `${head}\n…` : head
}
