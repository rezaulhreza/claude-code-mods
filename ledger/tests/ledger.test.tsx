import { expect, test } from 'claude-code/testing'

import { groupLine } from '../hooks/register'

const row = (props: Record<string, unknown>) =>
  ({
    plugin: 'ledger',
    surface: 'terminal',
    component: 'ToolUse',
    requestId: 'toolu_1',
    props: { tool_use_id: 'toolu_1', isRunning: false, isErrored: false, isInterrupted: false, ...props },
  }) as never

test('the group line counts what the calls did', () => {
  expect(
    groupLine([
      { tool: 'Read', input: {} },
      { tool: 'Read', input: {} },
      { tool: 'Bash', input: { command: 'rg priceFor app' } },
      { tool: 'Bash', input: { command: 'ls app' } },
    ]),
  ).toBe('Read 2 files · searched 1 pattern · listed 1 folder')
})

test('tool rows read as one ledger line', async ($, on) => {
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>engine</Text>
  })
  await $.session.start({ cwd: '/w', surface: 'terminal', isInteractive: true })

  const edit = await $.ui.mount(
    row({
      tool: 'Edit',
      input: { file_path: '/w/app/Scorer.php' },
      output: { filePath: '/w/app/Scorer.php', structuredPatch: [{ lines: ['+a', '+b', '-c'] }] },
    }),
  )
  expect(await edit.find({ type: 'Text', text: /app\/Scorer.php/ })).toBeDefined()
  expect(await edit.find({ type: 'Text', text: /\+2 −1/ })).toBeDefined()
  await edit.unmount()

  const failed = await $.ui.mount(
    row({
      tool: 'Bash',
      input: { command: 'php artisan test' },
      isErrored: true,
      output: 'Exit code 1\nFAILED short call floor',
    }),
  )
  expect((await failed.find({ type: 'Text', text: /exit 1/ }))?.text).toContain('exit 1 · FAILED short call floor')
  await failed.unmount()

  const other = await $.ui.mount(row({ tool: 'AskUserQuestion', input: {} }))
  expect((await other.find({ type: 'Text' }))?.text).toBe('engine')
  await other.unmount()
})
