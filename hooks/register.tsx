import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { LookName } from '../types'
import { drawBand } from './band'
import { NO_USAGE, readUsage } from './info'
import { DEFAULT_LOOK, findLook, LOOK_NAMES, LOOKS } from './looks'

const isShown = atom({ plugin: 'claude-mascot', key: 'isShown' } as const, true)
const look = atom({ plugin: 'claude-mascot', key: 'look' } as const, DEFAULT_LOOK)
const minute = atom({ plugin: 'claude-mascot', key: 'minute' } as const, 0)
const usage = atom({ plugin: 'claude-mascot', key: 'usage' } as const, NO_USAGE)
const model = atom({ plugin: 'claude-mascot', key: 'model' } as const, null)
const STORE_SHOWN = 'isShown'
const STORE_LOOK = 'look'

/** `/mascot style` with no name: the look now, and the ones to pick from. */
function styleList(current: LookName): string {
  const lines = LOOK_NAMES.map(name => `${name === current ? '▸' : ' '} ${name} · ${LOOKS[name].description}`)
  return `Pick a style with /mascot style <name>:\n${lines.join('\n')}`
}

/** What `/mascot` takes; shown for `help` and for anything it does not know, rather than guessing. */
const USAGE = [
  '/mascot · hide or show it',
  '/mascot on · /mascot off',
  `/mascot style · list the styles (${LOOK_NAMES.join(', ')})`,
  '/mascot style <name> · switch style; /mascot <name> works too',
].join('\n')

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
    const savedLook = findLook(await $.store.get(STORE_LOOK)) ?? DEFAULT_LOOK
    await update($, isShown, () => saved !== false)
    await update($, look, () => savedLook)
    await $.command.register({
      name: 'mascot',
      description: 'Show or hide the little Claude mascot above the prompt, or pick its style',
      argumentHint: '[on|off|style [classic|behind]|help]',
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
    // `/mascot style <name>`, or the name alone.
    const style = /^(?:style|look)\b\s*(.*)$/.exec(arg)
    const wanted = style ? (style[1] ?? '').trim() : findLook(arg) ? arg : null
    if (wanted !== null) {
      if (!wanted) return { text: styleList(await read($, look)) }
      const picked = findLook(wanted)
      if (!picked) return { text: `No style called "${wanted}". ${styleList(await read($, look))}` }
      await update($, look, () => picked)
      await $.store.set(STORE_LOOK, picked)
      return { text: `Mascot style: ${picked}, ${LOOKS[picked].description}.` }
    }
    if (arg === 'help') return { text: USAGE }
    // Only a bare `/mascot` toggles: an unknown word answers with the usage and changes nothing.
    if (arg !== '' && arg !== 'on' && arg !== 'off') return { text: `No /mascot option "${arg}".\n${USAGE}` }
    const value = arg === 'on' ? true : arg === 'off' ? false : !(await read($, isShown))
    await update($, isShown, () => value)
    await $.store.set(STORE_SHOWN, value)
    return { text: value ? 'The mascot is back above the prompt.' : 'The mascot is hidden. /mascot brings it back.' }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.surface !== 'desktop' || e.props.hasSurvey || !(await read($, isShown))) return next(e)
    return drawBand($.ui.resolve(e), {
      look: await read($, look),
      mode: e.props.isWorking ? 'working' : 'idle',
      at: (await read($, minute)) * 60_000 || (await $.clock.now()),
      model: await read($, model),
      usage: await read($, usage),
      columns: e.props.bodyColumns,
    })
  })
}
