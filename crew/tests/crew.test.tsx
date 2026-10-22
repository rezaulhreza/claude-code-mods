import { expect, mock, test } from 'claude-code/testing'

import { avatarCells, pixels } from '../hooks/avatar'

const PANE_PROPS = {
  isFocused: false,
  bodyColumns: 48,
  placement: 'dock',
  scroll: { offset: 0, bodyRows: 30 },
  view: {},
} as const

const crewPane = (surface: 'terminal' | 'desktop') =>
  ({ plugin: 'crew', surface, component: 'Pane', requestId: 'crew', props: { title: 'Agents', ...PANE_PROPS } }) as const

const agentPane = (surface: 'terminal' | 'desktop') =>
  ({
    plugin: 'crew',
    surface,
    component: 'Pane',
    requestId: 'agent-abc123',
    props: { title: 'Explore abc1', ...PANE_PROPS },
  }) as const

test('avatars are mirrored, stable and differ per agent', () => {
  const grid = pixels('abc123', 'Explore')

  for (const row of grid) {
    expect(row.slice(0, 3)).toEqual([...row.slice(3)].reverse())
  }

  expect(avatarCells('abc123', 'Explore', false)).toBe(avatarCells('abc123', 'Explore', false))
  expect(avatarCells('abc123', 'Explore', false)).not.toBe(avatarCells('def456', 'Explore', false))
  expect(avatarCells('abc123', 'Explore', false)).not.toBe(avatarCells('abc123', 'Explore', true))
})

test('a spawned agent shows in the crew pane, its tools in its own pane, and takes a message', async ($, on) => {
  const sent: unknown[] = []
  mock.clock(on, { now: 1000 })

  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('command.register', () => ({ value: { command: 'crew' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('agent.spawn', () => ({ model: 'claude-sonnet-5-5', agentId: 'abc123' }))
  on('tool.call', () => ({ result: { type: 'text', file: { numLines: 88 } } }))
  on('session.send', (_, e) => {
    sent.push(e)

    return { isDelivered: true }
  })

  await $.session.start({ cwd: '/w', surface: 'terminal', isInteractive: true })
  await $.agent.spawn({
    tool_use_id: 'toolu_1',
    prompt: 'Find callers',
    description: 'find PriceCalc callers',
    subagentType: 'Explore',
    provider: { plugin: 'engine', tier: 'core' },
    parentModel: 'claude-opus-5-5',
    background: false,
    fork: false,
  })
  await $.tool.call({ tool: 'Read', file_path: '/w/app/Jobs/SyncOrders.php', agentId: 'abc123' })

  for (const surface of ['terminal', 'desktop'] as const) {
    const crew = await $.ui.mount(crewPane(surface))
    expect((await crew.find({ type: 'Text', text: /1 running/ }))?.text).toContain('1 running')
    expect(await crew.find({ type: 'Text', text: /find PriceCalc callers/ })).toBeDefined()
    expect(await crew.find({ type: 'Text', text: /sonnet · 1 · reading app\/Jobs\/SyncOrders.php/ })).toBeDefined()

    if (surface === 'terminal') {
      expect(await crew.find({ type: 'Raster' })).toBeDefined()
    }

    await crew.unmount()
  }

  for (const surface of ['terminal', 'desktop'] as const) {
    const pane = await $.ui.mount(agentPane(surface))
    expect(await pane.find({ type: 'Text', text: /app\/Jobs\/SyncOrders.php/ })).toBeDefined()
    expect(await pane.find({ type: 'Text', text: /88 lines/ })).toBeDefined()
    await pane.unmount()
  }

  const pane = await $.ui.mount(agentPane('terminal'))
  await pane.input({ key: 'message', text: 'Skip tests/. Only app code.' })
  expect(await pane.find({ type: 'Text', text: /delivered/ })).toBeDefined()
  expect(sent).toHaveLength(1)
  expect(sent[0]).toMatchObject({ text: 'Skip tests/. Only app code.' })
  await pane.unmount()
})
