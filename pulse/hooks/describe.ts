type Input = { tool: string } & Record<string, unknown>

export type FileDiff = { file: string; added: number; removed: number }

export type TurnStat = { durationMs: number; tools: number; files: number; added: number; removed: number }

const HOME = /^\/(Users|home)\/[^/]+/

export function relative(path: string, cwd: string): string {
  if (cwd && path.startsWith(cwd + '/')) {
    return path.slice(cwd.length + 1)
  }

  return path.replace(HOME, '~')
}

export function clip(text: string, max: number): string {
  const line = text.split('\n')[0]!.replace(/\s+/g, ' ').trim()

  return line.length > max ? line.slice(0, max - 1) + '…' : line
}

function str(input: Input, key: string): string {
  const value = input[key]

  return typeof value === 'string' ? value : ''
}

// What the main loop is doing, as one short present-tense phrase.
export function describe(input: Input, cwd: string): string {
  const file = relative(str(input, 'file_path') || str(input, 'notebook_path'), cwd)

  switch (input.tool) {
    case 'Read':
      return `Reading ${file}`
    case 'Edit':
    case 'MultiEdit':
    case 'NotebookEdit':
      return `Editing ${file}`
    case 'Write':
      return `Writing ${file}`
    case 'Bash':
      return `Running ${clip(str(input, 'command'), 60)}`
    case 'WebFetch':
      return `Fetching ${clip(str(input, 'url').replace(/^https?:\/\//, ''), 50)}`
    case 'WebSearch':
      return `Searching the web for "${clip(str(input, 'query'), 40)}"`
    case 'Agent': {
      const type = str(input, 'subagent_type') || 'agent'

      return `Waiting on ${type}: ${clip(str(input, 'description'), 40)}`
    }
    case 'Skill':
      return `Using skill ${str(input, 'skill')}`
    case 'TodoWrite':
    case 'TaskCreate':
    case 'TaskUpdate':
      return 'Updating tasks'
  }

  const mcp = /^mcp__(.+?)__(.+)$/.exec(input.tool)

  if (mcp) {
    return `Calling ${mcp[1]} ${mcp[2]}`
  }

  return `Using ${input.tool}`
}

// The tool's short verb and what it acts on, for a ledger-style row.
export function target(input: Input, cwd: string): { verb: string; what: string } {
  const file = relative(str(input, 'file_path') || str(input, 'notebook_path'), cwd)

  switch (input.tool) {
    case 'Read':
    case 'Write':
      return { verb: input.tool, what: file }
    case 'Edit':
    case 'MultiEdit':
    case 'NotebookEdit':
      return { verb: 'Edit', what: file }
    case 'Bash':
      return { verb: 'Bash', what: clip(str(input, 'command'), 200) }
    case 'WebFetch':
      return { verb: 'Fetch', what: clip(str(input, 'url').replace(/^https?:\/\//, ''), 200) }
    case 'WebSearch':
      return { verb: 'Search', what: `"${clip(str(input, 'query'), 200)}" on the web` }
    case 'Agent':
      return { verb: 'Agent', what: `${str(input, 'subagent_type') || 'agent'} · ${clip(str(input, 'description'), 200)}` }
    case 'Skill':
      return { verb: 'Skill', what: str(input, 'skill') }
  }

  const mcp = /^mcp__(.+?)__(.+)$/.exec(input.tool)

  if (mcp) {
    return { verb: mcp[1]!, what: mcp[2]! }
  }

  const first = Object.entries(input).find(([key, value]) => key !== 'tool' && typeof value === 'string')

  return { verb: input.tool, what: first ? clip(String(first[1]), 200) : '' }
}

type Ran = { result?: unknown; text?: string; isError?: boolean; deny?: string }

// One plain summary of a finished call: lines read, diff size, the first error line.
export function noteOf(tool: string, ran: Ran): string {
  if (ran.deny !== undefined) {
    return clip(`refused: ${ran.deny}`, 80)
  }

  if (ran.isError) {
    const lines = (ran.text ?? '').split('\n').map(one => one.trim())
    const code = lines.map(one => /^(?:error: )?exit code (\d+)/i.exec(one)).find(Boolean)
    const first = lines.find(one => one && !/^(?:error: )?exit code \d+/i.test(one))
    const parts = [code ? `exit ${code[1]}` : '', first ?? (code ? '' : 'failed')].filter(Boolean)

    return clip(parts.join(' · '), 80)
  }

  const r = (ran.result ?? {}) as Record<string, unknown>

  if (tool === 'Read') {
    const file = r.file as { numLines?: number } | undefined

    return typeof file?.numLines === 'number' ? `${file.numLines} lines` : ''
  }

  const diffs = diffsOf(tool, ran.result)

  if (tool === 'Write' && r.type === 'create' && diffs[0]) {
    return `new · ${diffs[0].added} lines`
  }

  if (diffs.length) {
    const added = diffs.reduce((sum, d) => sum + d.added, 0)
    const removed = diffs.reduce((sum, d) => sum + d.removed, 0)

    return removed ? `+${added} −${removed}` : `+${added}`
  }

  return ''
}

type Hunk = { lines: string[] }

function count(file: string, hunks: readonly Hunk[]): FileDiff {
  let added = 0
  let removed = 0

  for (const hunk of hunks) {
    for (const line of hunk.lines) {
      if (line.startsWith('+')) added += 1
      else if (line.startsWith('-')) removed += 1
    }
  }

  return { file, added, removed }
}

// The files a finished call changed, with line counts, from the tool's own result.
export function diffsOf(tool: string, result: unknown): FileDiff[] {
  if (!result || typeof result !== 'object') {
    return []
  }

  const r = result as Record<string, unknown>

  if ((tool === 'Edit' || tool === 'Write') && typeof r.filePath === 'string') {
    if (tool === 'Write' && r.type === 'create' && typeof r.content === 'string') {
      return [{ file: r.filePath, added: r.content.replace(/\n$/, '').split('\n').length, removed: 0 }]
    }

    return [count(r.filePath, (r.structuredPatch as Hunk[] | undefined) ?? [])]
  }

  if (tool === 'Bash' && r.bashEditDiff && typeof r.bashEditDiff === 'object') {
    const files = (r.bashEditDiff as { files?: { filePath: string; hunks: Hunk[] }[] }).files ?? []

    return files.map(one => count(one.filePath, one.hunks))
  }

  return []
}

export function duration(ms: number): string {
  const s = Math.round(ms / 1000)

  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`

  return `${Math.floor(s / 3600)}h ${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}m`
}

const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`

export function turnLine(durationMs: number, stat: TurnStat | undefined): string {
  const parts = [`✓ Done in ${duration(durationMs)}`]

  if (stat) {
    parts.push(stat.tools ? plural(stat.tools, 'tool') : 'no tools')
    if (stat.files) parts.push(`${plural(stat.files, 'file')} changed`)
    if (stat.added || stat.removed) parts.push(`+${stat.added} −${stat.removed}`)
  }

  return parts.join(' · ')
}

// The turn whose recorded length is nearest to the line's, within 1.5 s.
export function closest(list: readonly TurnStat[], durationMs: number): TurnStat | undefined {
  let best: TurnStat | undefined
  let gap = 1500

  for (const stat of list) {
    const d = Math.abs(stat.durationMs - durationMs)

    if (d <= gap) {
      best = stat
      gap = d
    }
  }

  return best
}

export function modelLabel(model: string): string {
  const m = /^claude-([a-z]+)-(\d+)-(\d+)/.exec(model)

  return m ? `${m[1]}-${m[2]}.${m[3]}` : model.replace(/^claude-/, '')
}

type Usage = {
  context?: { percent?: number }
  rateLimits?: readonly { kind: string; percentUsed: number }[]
  cost?: { usd: number }
}

export function statusLine(model: string, usage: Usage, effort?: string | number, warnAt = 75): string {
  const parts = [effort === undefined ? modelLabel(model) : `${modelLabel(model)} ${effort}`]
  const pct = usage.context?.percent

  if (pct !== undefined) {
    parts.push(pct >= warnAt ? `context ${pct}%, compact soon` : `context ${pct}%`)
  }

  for (const limit of usage.rateLimits ?? []) {
    if (limit.kind === 'five_hour') parts.push(`5h limit ${Math.round(limit.percentUsed)}%`)
    if (limit.kind === 'seven_day') parts.push(`week limit ${Math.round(limit.percentUsed)}%`)
  }

  if (usage.cost) {
    parts.push(`$${usage.cost.usd.toFixed(2)}`)
  }

  return parts.join(' · ')
}
