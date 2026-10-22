import type { Register } from 'claude-code'

import { hex, hueOf } from './avatar'
import { clip, noteOf, target } from './describe'

const RED = '#F0776B'

// Tools whose row ledger draws; every other tool keeps the engine's own row.
const LEDGER = new Set(['Read', 'Edit', 'MultiEdit', 'Write', 'NotebookEdit', 'Bash', 'WebFetch', 'WebSearch', 'Agent', 'Skill', 'Grep', 'Glob', 'LSP'])

// The engine's result block stays for these: the diff is the review.
const KEEP_RESULT = new Set(['Edit', 'MultiEdit', 'Write', 'NotebookEdit'])

const isLedger = (tool: string) => LEDGER.has(tool) || tool.startsWith('mcp__')

type Input = Parameters<typeof target>[0]

const asInput = (tool: string, input: unknown): Input => ({ ...(input as object), tool }) as Input

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

// The folded group's line: "Read 3 files · searched 2 patterns · listed 1 folder".
export function groupLine(calls: readonly { tool: string; input: unknown }[]): string {
  let files = 0
  let patterns = 0
  let folders = 0
  let commands = 0

  for (const call of calls) {
    const command = String((call.input as { command?: unknown } | null)?.command ?? '')

    if (call.tool === 'Read') files += 1
    else if (call.tool === 'Grep' || call.tool === 'Glob' || /^\s*(rg|grep|find|fd|ag)\b/.test(command)) patterns += 1
    else if (/^\s*(ls|tree)\b/.test(command)) folders += 1
    else commands += 1
  }

  const parts = [
    files ? `read ${plural(files, 'file')}` : '',
    patterns ? `searched ${plural(patterns, 'pattern')}` : '',
    folders ? `listed ${plural(folders, 'folder')}` : '',
    commands ? `ran ${plural(commands, 'command')}` : '',
  ].filter(Boolean)
  const line = parts.join(' · ')

  return line.charAt(0).toUpperCase() + line.slice(1)
}

export const register: Register = (on, options) => {
  const ACCENT = String(options.accent || '#D97757')
  let cwd = ''

  on('session.start', async ($, e, next) => {
    const started = await next(e)
    cwd = e.cwd

    return started
  })

  on('ui.render', { component: 'ToolUse' }, ($, e, next) => {
    if (e.surface !== 'terminal' || e.props.isExpanded || !isLedger(e.props.tool)) {
      return next(e)
    }

    const { Box, Text } = $.ui.resolve(e)
    const { tool, isRunning, isErrored, isInterrupted, output } = e.props
    const input = asInput(tool, e.props.input)
    const { verb, what } = target(input, cwd)
    const note = isRunning
      ? 'running'
      : isInterrupted
        ? 'interrupted'
        : noteOf(tool, { result: output, isError: isErrored, text: isErrored ? String(output ?? '') : undefined })
    const glyph = isRunning ? '●' : isInterrupted ? '–' : isErrored ? '✗' : '✓'
    const colour = isErrored ? RED : undefined
    const agentType = tool === 'Agent' ? String((e.props.input as { subagent_type?: unknown }).subagent_type ?? 'agent') : null

    return (
      <Box flexDirection="row">
        <Text color={isRunning ? ACCENT : colour} dimColor={isInterrupted}>
          {glyph}
        </Text>
        <Text color={colour}>{` ${verb.padEnd(7)} `}</Text>
        {agentType !== null && <Text backgroundColor={hex(hueOf(agentType))}>{'  '}</Text>}
        {agentType !== null && <Text> </Text>}
        <Box flexGrow={1} flexShrink={1}>
          <Text color={colour} wrap="truncate-end">
            {what}
          </Text>
        </Box>
        {note ? <Text color={colour} dimColor={!isErrored}>{`  ${clip(note, 60)}`}</Text> : null}
      </Box>
    )
  })

  on('ui.render', { component: 'ToolResult' }, ($, e, next) => {
    if (e.surface !== 'terminal' || e.props.isExpanded || !isLedger(e.props.tool) || (options.keepDiffs !== false && KEEP_RESULT.has(e.props.tool))) {
      return next(e)
    }

    const { Box } = $.ui.resolve(e)

    return <Box />
  })

  on('ui.render', { component: 'ToolGroup' }, ($, e, next) => {
    if (e.surface !== 'terminal' || e.props.isExpanded || e.props.isCallsOnly !== true || e.props.calls.length === 0) {
      return next(e)
    }

    const { Text } = $.ui.resolve(e)
    const isRunning = e.props.calls.some(call => call.isRunning)

    return (
      <Text wrap="truncate-end">
        <Text color={isRunning ? ACCENT : undefined}>{isRunning ? '●' : '✓'}</Text>
        {` ${groupLine(e.props.calls)}`}
      </Text>
    )
  })
}
