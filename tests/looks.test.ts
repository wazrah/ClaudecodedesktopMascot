import { expect, test } from 'claude-code/testing'

import { DEFAULT_LOOK, findLook, LOOK_NAMES, LOOKS } from '../hooks/looks'

test('finds a look by name, whatever the case', () => {
  expect(findLook('classic')).toBe('classic')
  expect(findLook(' Behind ')).toBe('behind')
  expect(findLook('front')).toBeUndefined()
  expect(findLook(undefined)).toBeUndefined()
  expect(DEFAULT_LOOK).toBe('classic')
})

for (const look of LOOK_NAMES) {
  test(`${look}: one drawing per mode, each self-contained`, () => {
    const working = LOOKS[look].svg('working')
    const idle = LOOKS[look].svg('idle')
    expect(working).not.toBe(idle)
    for (const svg of [working, idle]) {
      expect(svg.startsWith('<svg')).toBe(true)
      // Without it the desktop paints the frame white in dark mode.
      expect(svg).toContain(':root{color-scheme:light dark}')
      expect(svg).toContain('id="hit"')
      expect(svg).not.toMatch(/<script|\son[a-z]+=/i)
      expect(svg.length).toBeLessThan(131072)
    }
  })
}
