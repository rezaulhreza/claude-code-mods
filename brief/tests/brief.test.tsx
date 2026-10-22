import { expect, mock, test } from 'claude-code/testing'

import { ago, firstLine } from '../hooks/register'

const HOUR = 3600 * 1000
const NOW = 1_800_000_000_000

const band = (surface: 'terminal' | 'desktop') =>
  ({
    plugin: 'brief',
    surface,
    component: 'AbovePrompt',
    requestId: 'band',
    props: {
      hasSurvey: false,
      isWorking: false,
      maxRows: 10,
      bodyColumns: 80,
      scroll: { offset: 0, bodyRows: 9 },
      view: {},
    },
  }) as const

const GIT: Record<string, string> = {
  'rev-parse': 'feat/price-rules',
  status: ' M a.php\n M b.php\n?? c.php',
  'rev-list': '2',
  log: `${(NOW - 2 * HOUR) / 1000}\tAdd tax rules to PriceCalc`,
}

test('times and first lines read cleanly', () => {
  expect(ago(30 * 1000)).toBe('just now')
  expect(ago(18 * HOUR)).toBe('18h ago')
  expect(ago(72 * HOUR)).toBe('3d ago')
  expect(firstLine('## Done\n\nTests pass.')).toBe('Done')
})

test('a new session shows git state and the last stop, and hides at the first prompt', async ($, on) => {
  mock.clock(on, { now: NOW })
  mock.store(on, { 'last:/Users/dev/shop': { at: NOW - 18 * HOUR, text: 'Tests pass. Wire it into checkout next.' } })
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('process.run', (_, e) => {
    const argv = (e as { argv: string[] }).argv

    return { value: { exitCode: 0, stdout: GIT[argv[1]!] ?? '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  on('prompt.submit', (_, e) => e)
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>engine</Text>
  })

  await $.session.start({ cwd: '/Users/dev/shop', surface: 'terminal', isInteractive: true })

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount(band(surface))
    expect((await ui.find({ type: 'Text', text: /~\/shop/ }))?.text).toContain('~/shop')
    expect((await ui.find({ type: 'Text', text: /feat\/price-rules/ }))?.text).toContain('3 changed · 2 ahead')
    expect((await ui.find({ type: 'Text', text: /tax rules/ }))?.text).toContain('2h ago')
    expect((await ui.find({ type: 'Text', text: /Tests pass/ }))?.text).toContain('18h ago')
    await ui.unmount()
  }

  await $.prompt.submit({ text: 'hi' } as never)
  const ui = await $.ui.mount(band('terminal'))
  expect((await ui.find({ type: 'Text' }))?.text).toBe('engine')
  await ui.unmount()
})
