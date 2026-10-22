import { expect, test } from 'claude-code/testing'

import { closest, describe, diffsOf, statusLine, turnLine } from '../hooks/describe'

const SPINNER = {
  plugin: 'pulse',
  surface: 'terminal',
  component: 'Spinner',
  requestId: 'main',
  props: { word: 'Sauteing', message: null, suffix: '…', mode: 'tool-use' },
} as const

const TURN = {
  plugin: 'pulse',
  surface: 'terminal',
  component: 'TurnDuration',
  requestId: 'turn-1',
  props: { word: 'Baked', durationMs: 64000 },
} as const

test('describe names the work in plain words', () => {
  const cwd = '/Users/dev/app'

  expect(describe({ tool: 'Read', file_path: '/Users/dev/app/src/a.ts' }, cwd)).toBe('Reading src/a.ts')
  expect(describe({ tool: 'Edit', file_path: '/Users/dev/other/b.ts' }, cwd)).toBe('Editing ~/other/b.ts')
  expect(describe({ tool: 'Bash', command: 'npm   test\n&& echo' }, cwd)).toBe('Running npm test')
  expect(describe({ tool: 'Agent', subagent_type: 'Explore', description: 'find callers' }, cwd)).toBe(
    'Waiting on Explore: find callers',
  )
  expect(describe({ tool: 'mcp__github__create_pr' }, cwd)).toBe('Calling github create_pr')
})

test('diffs count added and removed lines', () => {
  const edit = { filePath: '/a.ts', structuredPatch: [{ lines: [' x', '+y', '+z', '-w'] }] }

  expect(diffsOf('Edit', edit)).toEqual([{ file: '/a.ts', added: 2, removed: 1 }])
  expect(diffsOf('Write', { type: 'create', filePath: '/b.ts', content: 'a\nb\n' })).toEqual([
    { file: '/b.ts', added: 2, removed: 0 },
  ])
  expect(diffsOf('Read', { file: {} })).toEqual([])
})

test('turn line and status line read cleanly', () => {
  const stat = { durationMs: 64200, tools: 9, files: 3, added: 48, removed: 12 }

  expect(turnLine(64000, stat)).toBe('✓ Done in 1m 04s · 9 tools · 3 files changed · +48 −12')
  expect(turnLine(8000, undefined)).toBe('✓ Done in 8s')
  expect(closest([stat], 64000)).toBe(stat)
  expect(closest([stat], 90000)).toBeUndefined()
  expect(
    statusLine('claude-opus-5-5', {
      context: { percent: 81 },
      rateLimits: [{ kind: 'five_hour', percentUsed: 64.4 }, { kind: 'seven_day', percentUsed: 31 }],
      cost: { usd: 2.4 },
    }),
  ).toBe('opus-5.5 · context 81%, compact soon · 5h limit 64% · week limit 31% · $2.40')
  expect(statusLine('claude-opus-5-5', {}, 'high')).toBe('opus-5.5 high')
})

test('the spinner says what the running tool does', async ($, on) => {
  let reached = () => {}
  const isReached = new Promise<void>(resolve => (reached = resolve))
  let release = () => {}
  const gate = new Promise<void>(resolve => (release = resolve))

  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.usage', () => ({ value: { startedAt: 0, context: { window: 200000 }, rateLimits: [] } }))
  on('session.model', () => ({ value: 'claude-opus-5-5' }))
  on('tool.call', async () => {
    reached()
    await gate

    return { result: {} }
  })
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    const props = e.props as { message: string | null; word: string }

    return <Text>{props.message ?? props.word}</Text>
  })

  await $.session.start({ cwd: '/w', surface: 'terminal', isInteractive: true })
  const call = $.tool.call({ tool: 'Bash', command: 'npm test' })
  await isReached

  const ui = await $.ui.mount(SPINNER)
  expect((await ui.find({ type: 'Text' }))?.text).toBe('Running npm test')
  await ui.unmount()

  release()
  await call
})

test('an old turn line still reads as done, with its time', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>engine</Text>
  })

  const ui = await $.ui.mount(TURN)
  expect((await ui.find({ type: 'Text' }))?.text).toBe('✓ Done in 1m 04s')
  await ui.unmount()
})
