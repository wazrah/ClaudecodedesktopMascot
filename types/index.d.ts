/** What the mascot is up to: at the laptop while a turn runs, on a break otherwise. */
export type Mode = 'working' | 'idle'

/** How the mascot is drawn: `classic`, the laptop at its side; `behind`, sitting behind it. */
export type LookName = 'classic' | 'behind'

/** One rate-limit window: how much of it is used, and when it resets (epoch ms). */
export type Meter = { percent: number; resetsAt: number | null }

/** The band's figures as the engine last measured them; null until there is a reading. */
export type Usage = { fiveHour: Meter | null; week: Meter | null; context: number | null }

declare module 'claude-code' {
  interface PluginState {
    'claude-mascot': {
      isShown: boolean
      look: LookName
      /** The current minute (epoch ms / 60000), so the clock line redraws once a minute. */
      minute: number
      usage: Usage
      model: string | null
    }
  }
}
