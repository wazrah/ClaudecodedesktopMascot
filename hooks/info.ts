/**
 * The words beside the mascot: the clock line, and the usage gauges as plain
 * strings and levels, so the render hook only lays them out.
 */
import type { SessionContextUsage, SessionRateLimit } from 'claude-code'

import type { Meter, Usage } from '../types'

const TWELVE_HOUR = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
const DAY = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
const WEEKDAY = new Intl.DateTimeFormat('en-GB', { weekday: 'short' })

export const NO_USAGE: Usage = { fiveHour: null, week: null, context: null }

function meter(limits: readonly SessionRateLimit[], kind: string): Meter | null {
  const limit = limits.find(l => l.kind === kind)
  if (!limit) return null
  const resetsAt = limit.resetsAt ? Date.parse(limit.resetsAt) : NaN
  return { percent: limit.percentUsed, resetsAt: Number.isFinite(resetsAt) ? resetsAt : null }
}

/** `$.session.usage()` or a `session.measure`, as the band keeps it. */
export function readUsage(rateLimits: readonly SessionRateLimit[], context: SessionContextUsage): Usage {
  return {
    fiveHour: meter(rateLimits, 'five_hour'),
    week: meter(rateLimits, 'seven_day'),
    context: context.percent ?? null,
  }
}

/** `claude-opus-5-5[1m]` reads as `Opus 5.5`; an id it does not know stays as it is. */
export function modelLabel(id: string): string {
  const m = /(opus|sonnet|haiku|fable)-(\d+)(?:-(\d{1,2}))?(?!\d)/i.exec(id)
  if (!m) return id
  const family = m[1]!.charAt(0).toUpperCase() + m[1]!.slice(1).toLowerCase()
  return m[3] ? `${family} ${m[2]}.${m[3]}` : `${family} ${m[2]}`
}

/** `9:42 PM`: newer ICU puts a narrow no-break space before the AM/PM, which some fonts lack. */
const clock = (at: number) => TWELVE_HOUR.format(at).replace(/[  ]/g, ' ')

/** `9:42 PM · Sat 3 Oct · Opus 5.5`, in this computer's own time zone. */
export function headline(at: number, model: string | null): string {
  const parts = [clock(at), DAY.format(at)]
  if (model) parts.push(modelLabel(model))
  return parts.join(' · ')
}

/** How close to the limit: calm, getting there, nearly out. */
export type Level = 'ok' | 'warn' | 'high'

export const level = (percent: number, warn: number, high: number): Level =>
  percent >= high ? 'high' : percent >= warn ? 'warn' : 'ok'

/** Five cells, one per 20%: `▰▰▰▱▱`. */
export function bar(percent: number, cells = 5): string {
  const full = Math.max(0, Math.min(cells, Math.round(percent / (100 / cells))))
  return '▰'.repeat(full) + '▱'.repeat(cells - full)
}

export const percentLabel = (percent: number) => `${Math.round(percent)}%`
export const resetTime = (at: number) => clock(at)
export const resetDay = (at: number) => WEEKDAY.format(at)
