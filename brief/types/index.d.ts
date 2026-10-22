export type Brief = {
  name: string
  path: string
  branch: string | null
  changed: number
  ahead: number
  commit: { at: number; subject: string } | null
  last: { at: number; text: string } | null
  now: number
}

declare module 'claude-code' {
  interface PluginState {
    brief: { info: Brief | null; isHidden: boolean }
  }
}
