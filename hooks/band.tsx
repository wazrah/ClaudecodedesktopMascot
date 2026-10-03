/**
 * The band above the prompt, laid out from plain figures: the clock line and
 * the usage gauges on the left, the mascot on the right.
 */
import type { ElementTable } from 'claude-code'

import type { Meter, Mode, Usage } from '../types'
import { bar, headline, level, percentLabel, resetDay, resetTime } from './info'
import { HEIGHT, mascotSvg, WIDTH } from './mascot'

/** Everything the band draws from. */
export type BandView = { mode: Mode; at: number; model: string | null; usage: Usage; columns: number }

const ALT: Record<Mode, string> = {
  working: 'A little Claude mascot typing on a laptop',
  idle: 'A little Claude mascot taking a break',
}

/**
 * One drawing per mode, built once. The band gets the same source until a
 * turn starts or ends, so the loop (and its breaks) plays on uninterrupted.
 */
const SOURCES: Record<Mode, string> = { working: mascotSvg('working'), idle: mascotSvg('idle') }

/** Below this many columns the gauges drop their bars, so the line still fits beside the mascot. */
const ROOMY_COLUMNS = 72

const TONE = { ok: 'green', warn: 'yellow', high: 'red' } as const

export function drawBand({ Box, Svg, Text }: ElementTable<'desktop'>, view: BandView) {
  const { fiveHour, week, context } = view.usage
  const isRoomy = view.columns >= ROOMY_COLUMNS

  const gauge = (label: string, meter: Meter | null, resets: (at: number) => string) => {
    if (!meter) return <Text dimColor>{`${label} –`}</Text>
    const tone = TONE[level(meter.percent, 60, 85)]
    return (
      <Box flexDirection="row">
        <Text dimColor>{`${label} `}</Text>
        {isRoomy && <Text color={tone}>{`${bar(meter.percent)} `}</Text>}
        <Text color={tone}>{percentLabel(meter.percent)}</Text>
        {meter.resetsAt !== null && <Text dimColor>{` ↻${resets(meter.resetsAt)}`}</Text>}
      </Box>
    )
  }

  const contextLevel = context === null ? null : level(context, 70, 85)
  const contextText =
    context === null || contextLevel === null ? (
      <Text dimColor>ctx –</Text>
    ) : contextLevel === 'ok' ? (
      <Text dimColor>{`ctx ${percentLabel(context)}`}</Text>
    ) : (
      <Text color={TONE[contextLevel]}>{`ctx ${percentLabel(context)}`}</Text>
    )

  return (
    <Box flexDirection="row" alignItems="center">
      <Box flexDirection="column" flexGrow={1} flexShrink={1} overflow="hidden">
        <Text dimColor wrap="truncate">{headline(view.at, view.model)}</Text>
        <Box flexDirection="row" columnGap={3} overflow="hidden">
          {gauge('5h', fiveHour, resetTime)}
          {gauge('week', week, resetDay)}
          {contextText}
        </Box>
      </Box>
      <Svg source={SOURCES[view.mode]} alt={ALT[view.mode]} width={WIDTH} height={HEIGHT} isInteractive />
    </Box>
  )
}
