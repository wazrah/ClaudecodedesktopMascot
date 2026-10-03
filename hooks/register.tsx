import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { drawBand } from './band'
import { NO_USAGE, readUsage } from './info'

const isShown = atom({ plugin: 'claude-mascot', key: 'isShown' } as const, true)
const minute = atom({ plugin: 'claude-mascot', key: 'minute' } as const, 0)
const usage = atom({ plugin: 'claude-mascot', key: 'usage' } as const, NO_USAGE)
const model = atom({ plugin: 'claude-mascot', key: 'model' } as const, null)
const STORE_SHOWN = 'isShown'

let lastMinute = 0

/** Moves the clock line on when the minute turns; a write only then, so the band redraws once a minute. */
async function tick($: EngineInterface) {
  const now = Math.floor((await $.clock.now()) / 60_000)
  if (now === lastMinute) return
  lastMinute = now
  await update($, minute, () => now)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const saved = await $.store.get(STORE_SHOWN)
    await update($, isShown, () => saved !== false)
    await $.command.register({
      name: 'mascot',
      description: 'Show or hide the little Claude mascot above the prompt',
      argumentHint: '[on|off]',
    })
    const measured = await $.session.usage()
    const id = await $.session.model()
    await update($, usage, () => readUsage(measured.rateLimits, measured.context))
    await update($, model, () => id)
    await tick($)
    $.clock.every(10_000, () => void tick($))
    return next(e)
  })

  // Pushed after each turn and whenever a limit moves a whole point.
  on('session.measure', async ($, e, next) => {
    const id = await $.session.model()
    await update($, usage, () => readUsage(e.rateLimits, e.context))
    await update($, model, () => id)
    return next(e)
  })

  on('command.run', { command: 'mascot' }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()
    const value = arg === 'on' ? true : arg === 'off' ? false : !(await read($, isShown))
    await update($, isShown, () => value)
    await $.store.set(STORE_SHOWN, value)
    return { text: value ? 'The mascot is back above the prompt.' : 'The mascot is hidden. /mascot brings it back.' }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.surface !== 'desktop' || e.props.hasSurvey || !(await read($, isShown))) return next(e)
    return drawBand($.ui.resolve(e), {
      mode: e.props.isWorking ? 'working' : 'idle',
      at: (await read($, minute)) * 60_000 || (await $.clock.now()),
      model: await read($, model),
      usage: await read($, usage),
      columns: e.props.bodyColumns,
    })
  })
}
