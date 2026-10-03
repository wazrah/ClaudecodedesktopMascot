import { expect, mock, test } from 'claude-code/testing'

import { drawBand } from '../hooks/band'

const NOW = Date.parse('2026-10-03T18:42:00Z')
const USAGE = {
  fiveHour: { percent: 42, resetsAt: Date.parse('2026-10-03T20:10:00Z') },
  week: { percent: 88.5, resetsAt: Date.parse('2026-10-08T09:00:00Z') },
  context: 76,
}
const PANE = { title: 'band', isFocused: false, bodyColumns: 100, placement: 'inline' as const, scroll: { offset: 0, bodyRows: 10 }, view: {} }

for (const columns of [100, 50]) {
  test(`seeded band validates on the desktop at ${columns} columns`, async ($, on) => {
    mock.clock(on, { now: NOW })
    on('ui.render', { component: 'Pane' }, async ($, e) => {
      if (e.surface !== 'desktop') throw new Error('desktop only')
      return drawBand($.ui.resolve(e), { mode: 'idle', at: NOW, model: 'claude-opus-5-5', usage: USAGE, columns })
    })
    const ui = await $.ui.mount({ plugin: 'claude-mascot', surface: 'desktop', component: 'Pane', props: PANE, requestId: 'band' })
    const info = JSON.stringify(((await ui.drawn()) as any).children[0])
    // Times are local, so the checks are by shape, not by value.
    expect(info).toMatch(/\d{1,2}:\d{2} [AP]M · [A-Z][a-z]{2} \d{1,2} [A-Z][a-z]{2} · Opus 5\.5/)
    expect(info).toMatch(/↻\d{1,2}:\d{2} [AP]M/)
    expect(info).toMatch(/↻(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/)
    expect(info).toContain('"color":"red"')
    expect(info).toContain('"color":"yellow"')
    if (columns >= 72) expect(info).toContain('▰▰▱▱▱')
    else expect(info).not.toContain('▰')
  })
}
