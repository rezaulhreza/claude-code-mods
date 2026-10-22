import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { TurnStat } from '../types'
import { closest, describe, diffsOf, statusLine, turnLine } from './describe'

const activity = atom({ plugin: 'pulse', key: 'activity' } as const, [])
const turns = atom({ plugin: 'pulse', key: 'turns' } as const, [])

type Tally = { tools: number; files: Map<string, true>; added: number; removed: number }

const fresh = (): Tally => ({ tools: 0, files: new Map(), added: 0, removed: 0 })

type Usage = Parameters<typeof statusLine>[1]

type Shown = { model: string; usage: Usage; effort: string | number | undefined; isOn: boolean; warnAt: number }

async function showStatus($: EngineInterface, shown: Shown) {
  if (shown.isOn) {
    $.ui.status(statusLine(shown.model || (await $.session.model()), shown.usage, shown.effort, shown.warnAt))
  }
}

export const register: Register = (on, options) => {
  let cwd = ''
  let tally = fresh()
  let seq = 0
  const shown: Shown = {
    model: '',
    usage: {},
    effort: undefined,
    isOn: options.statusLine !== false,
    warnAt: Number(options.contextWarn ?? 75),
  }

  on('session.start', async ($, e, next) => {
    const started = await next(e)
    cwd = e.cwd
    shown.usage = await $.session.usage()
    await showStatus($, shown)

    return started
  })

  on('session.measure', async ($, e, next) => {
    const measured = await next(e)
    shown.usage = e
    await showStatus($, shown)

    return measured
  })

  // Each main-loop request names the model and effort it runs at.
  on('turn.step', async function* ($, e, next) {
    if (!e.agentId && (e.effort !== shown.effort || e.model !== shown.model)) {
      shown.effort = e.effort
      shown.model = e.model
      await showStatus($ as EngineInterface, shown)
    }

    return yield* next(e)
  })

  on('turn.start', ($, e, next) => {
    if (!e.agentId) {
      tally = fresh()
    }

    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    if (e.agentId) {
      return next(e)
    }

    seq += 1
    const id = e.tool_use_id ?? `call-${seq}`
    const text = describe(e as Parameters<typeof describe>[0], cwd)
    await update($, activity, list => [...list, { id, text }])

    try {
      const ran = await next(e)
      tally.tools += 1

      for (const diff of diffsOf(e.tool, ran.result)) {
        tally.files.set(diff.file, true)
        tally.added += diff.added
        tally.removed += diff.removed
      }

      return ran
    } finally {
      await update($, activity, list => list.filter(one => one.id !== id))
    }
  }).catch(($, e, next) => next(e))

  on('turn.complete', async ($, e, next) => {
    const done = await next(e)

    if (!e.agentId) {
      const stat: TurnStat = {
        durationMs: e.durationMs,
        tools: tally.tools,
        files: tally.files.size,
        added: tally.added,
        removed: tally.removed,
      }
      await update($, turns, list => [...list, stat].slice(-200))
      await update($, activity, () => [])
    }

    return done
  })

  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    if (options.spinner === false || e.surface !== 'terminal' || e.props.message !== null) {
      return next(e)
    }

    const list = await read($, activity)
    const latest = list[list.length - 1]
    let message: string | undefined

    if (e.props.mode === 'thinking') {
      message = 'Thinking'
    } else if (e.props.mode === 'responding') {
      message = 'Writing reply'
    } else if (e.props.mode === 'tool-use' && latest) {
      message = list.length > 1 ? `${latest.text} (+${list.length - 1} more)` : latest.text
    }

    return message ? next({ ...e, props: { ...e.props, message } }) : next(e)
  })

  on('ui.render', { component: 'TurnDuration' }, async ($, e, next) => {
    if (options.turnLine === false || e.surface !== 'terminal' || e.props.isExpanded || e.props.waitingFor) {
      return next(e)
    }

    const stat = closest(await read($, turns), e.props.durationMs)
    const { Text } = $.ui.resolve(e)

    return <Text dimColor>{turnLine(e.props.durationMs, stat)}</Text>
  })
}
