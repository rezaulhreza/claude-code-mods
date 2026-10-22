import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Brief } from '../types'

const info = atom({ plugin: 'brief', key: 'info' } as const, null)
const isHidden = atom({ plugin: 'brief', key: 'isHidden' } as const, false)

const lastKey = (cwd: string) => `last:${cwd}`

export function ago(ms: number): string {
  const m = Math.floor(ms / 60000)

  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  if (m < 48 * 60) return `${Math.floor(m / 60)}h ago`

  return `${Math.floor(m / (24 * 60))}d ago`
}

export function firstLine(text: string, max = 90): string {
  const line = text.split('\n').map(one => one.replace(/^[#>*\-\s]+/, '').trim()).find(Boolean) ?? ''

  return line.length > max ? line.slice(0, max - 1) + '…' : line
}

async function git($: EngineInterface, cwd: string, args: string[]): Promise<string | null> {
  try {
    const ran = await $.process.run(['git', ...args], { cwd, timeoutMs: 3000 })

    return ran.exitCode === 0 ? ran.stdout.trim() : null
  } catch {
    return null
  }
}

async function gather($: EngineInterface, cwd: string): Promise<Brief> {
  const now = await $.clock.now()
  const stored = (await $.store.get(lastKey(cwd))) as { at: number; text: string } | undefined
  const branch = await git($, cwd, ['rev-parse', '--abbrev-ref', 'HEAD'])
  const status = branch === null ? null : await git($, cwd, ['status', '--porcelain'])
  const ahead = branch === null ? null : await git($, cwd, ['rev-list', '--count', '@{upstream}..HEAD'])
  const log = branch === null ? null : await git($, cwd, ['log', '-1', '--format=%ct%x09%s'])
  const [stamp, ...subject] = (log ?? '').split('\t')

  return {
    name: cwd.split('/').filter(Boolean).pop() ?? cwd,
    path: cwd.replace(/^\/(Users|home)\/[^/]+/, '~'),
    branch,
    changed: status ? status.split('\n').filter(Boolean).length : 0,
    ahead: Number(ahead ?? 0) || 0,
    commit: log ? { at: Number(stamp) * 1000, subject: subject.join('\t') } : null,
    last: stored && typeof stored.text === 'string' ? stored : null,
    now,
  }
}

export const register: Register = (on, options) => {
  const ACCENT = String(options.accent || '#D97757')
  let cwd = ''

  on('session.start', async ($, e, next) => {
    const started = await next(e)
    cwd = e.cwd

    if (e.isInteractive) {
      await update($, isHidden, () => false)
      await update($, info, () => null)
      void gather($, cwd).then(brief => update($, info, () => brief))
    }

    return started
  })

  on('prompt.submit', async ($, e, next) => {
    await update($, isHidden, () => true)

    return next(e)
  }).catch(($, e, next) => next(e))

  // Keep where this session stopped, for the next session in this folder.
  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    const text = firstLine(e.answer)

    if (!e.agentId && text && cwd && options.showLast !== false) {
      await $.store.set(lastKey(cwd), { at: await $.clock.now(), text })
    }

    return done
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const brief = await read($, info)

    if (!brief || e.props.hasSurvey || e.props.isWorking || e.props.view.agentId || (await read($, isHidden))) {
      return next(e)
    }

    const { Box, Text } = $.ui.resolve(e)
    const ahead = brief.ahead ? ` · ${brief.ahead} ahead` : ''
    const where = brief.branch === null ? ' · no git' : ''
    const first = brief.last === null ? ' · first session here' : ''

    return (
      <Box flexDirection="column">
        <Text wrap="truncate-end">
          <Text bold color={ACCENT}>
            {brief.name}
          </Text>
          <Text dimColor>{`  ${brief.path}${where}${first}`}</Text>
        </Text>
        {brief.branch !== null && (
          <Text wrap="truncate-end">
            <Text dimColor>{'branch  '}</Text>
            {brief.branch}
            <Text dimColor>{` · ${brief.changed ? `${brief.changed} changed` : 'clean'}${ahead}`}</Text>
          </Text>
        )}
        {brief.commit && (
          <Text wrap="truncate-end">
            <Text dimColor>{'commit  '}</Text>
            <Text dimColor>{`${ago(brief.now - brief.commit.at)}  `}</Text>
            {brief.commit.subject}
          </Text>
        )}
        {brief.last && options.showLast !== false && (
          <Text wrap="truncate-end">
            <Text dimColor>{'last    '}</Text>
            <Text dimColor>{`${ago(brief.now - brief.last.at)}  `}</Text>
            {brief.last.text}
          </Text>
        )}
      </Box>
    )
  })
}
