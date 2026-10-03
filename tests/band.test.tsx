import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

import { bar, headline, level, modelLabel, readUsage } from '../hooks/info'

const BAND = { hasSurvey: false, isWorking: true, maxRows: 10, bodyColumns: 100, scroll: { offset: 0, bodyRows: 10 }, view: {} }
const NOW = Date.parse('2026-10-03T18:42:00Z')

function world(on: On) {
  mock.clock(on, { now: NOW })
  mock.store(on)
  on('session.usage', async () => ({
    startedAt: NOW,
    context: { window: 200000, tokens: 152000, percent: 76 },
    rateLimits: [
      { kind: 'five_hour', percentUsed: 42, resetsAt: '2026-10-03T20:10:00Z' },
      { kind: 'seven_day', percentUsed: 88.5, resetsAt: '2026-10-08T09:00:00Z' },
    ],
  }))
  on('session.model', async () => 'claude-opus-5-5')
  on('ui.render', async ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine's own</Text>
  })
}

test('formats', () => {
  expect(modelLabel('claude-opus-5-5')).toBe('Opus 5.5')
  expect(modelLabel('claude-opus-5-5[1m]')).toBe('Opus 5.5')
  expect(modelLabel('claude-haiku-4-5-20251001')).toBe('Haiku 4.5')
  expect(modelLabel('claude-fable-5-1')).toBe('Fable 5.1')
  expect(modelLabel('claude-opus-5')).toBe('Opus 5')
  expect(modelLabel('opus')).toBe('opus')
  expect(bar(0)).toBe('▱▱▱▱▱')
  expect(bar(42)).toBe('▰▰▱▱▱')
  expect(bar(100)).toBe('▰▰▰▰▰')
  expect(level(59.9, 60, 85)).toBe('ok')
  expect(level(60, 60, 85)).toBe('warn')
  expect(level(90, 60, 85)).toBe('high')
  expect(headline(NOW, 'claude-opus-5-5')).toMatch(/^\d{2}:\d{2} · [A-Z][a-z]{2} \d{1,2} [A-Z][a-z]{2} · Opus 5\.5$/)
  const u = readUsage([{ kind: 'five_hour', percentUsed: 42, resetsAt: '2026-10-03T20:10:00Z' }, { kind: 'seven_day', percentUsed: 18.5 }], { window: 1000, percent: 38 })
  expect(u).toEqual({ fiveHour: { percent: 42, resetsAt: Date.parse('2026-10-03T20:10:00Z') }, week: { percent: 18.5, resetsAt: null }, context: 38 })
})

for (const bodyColumns of [100, 50]) {
  test(`band draws on the desktop at ${bodyColumns} columns`, async ($, on) => {
    world(on)
    const ui = await $.ui.mount({ plugin: 'claude-mascot', surface: 'desktop', component: 'AbovePrompt', props: { ...BAND, bodyColumns } })
    const tree = JSON.stringify(await ui.drawn())
    expect(tree).toContain('5h')
    expect(tree).toContain('ctx')
  })
}

test('band yields on the terminal and to a survey', async ($, on) => {
  world(on)
  const term = await $.ui.mount({ plugin: 'claude-mascot', surface: 'terminal', component: 'AbovePrompt', props: BAND })
  expect(JSON.stringify(await term.drawn())).toContain("engine's own")
  const survey = await $.ui.mount({ plugin: 'claude-mascot', surface: 'desktop', component: 'AbovePrompt', props: { ...BAND, hasSurvey: true } })
  expect(JSON.stringify(await survey.drawn())).toContain("engine's own")
})
