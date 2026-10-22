export type Activity = { id: string; text: string }

export type TurnStat = {
  durationMs: number
  tools: number
  files: number
  added: number
  removed: number
}

declare module 'claude-code' {
  interface PluginState {
    pulse: { activity: Activity[]; turns: TurnStat[] }
  }
}
