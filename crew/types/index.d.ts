export type AgentStatus = 'running' | 'done' | 'failed'

export type AgentRow = {
  id: string
  type: string
  task: string
  model: string
  status: AgentStatus
  startedAt: number
  endedAt: number | null
  tools: number
  live: string
}

export type FeedItem = {
  id: string
  kind: 'tool' | 'text' | 'you'
  verb: string
  text: string
  state: 'running' | 'done' | 'error'
  note: string
}

declare module 'claude-code' {
  interface PluginState {
    crew: {
      agents: AgentRow[]
      feeds: Record<string, FeedItem[]>
      drafts: Record<string, string>
      tick: number
    }
  }
}
