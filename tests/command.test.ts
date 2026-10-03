import { expect, mock, test } from 'claude-code/testing'

test('/mascot <name> and /mascot style <name> switch the style', async ($, on) => {
  mock.store(on)
  const picked = await $.command.run({ command: 'mascot', args: 'behind' })
  expect(picked?.text).toContain('Mascot style: behind')
  const listed = await $.command.run({ command: 'mascot', args: 'style' })
  expect(listed?.text).toContain('▸ behind')
  const back = await $.command.run({ command: 'mascot', args: 'style Classic' })
  expect(back?.text).toContain('Mascot style: classic')
  const unknown = await $.command.run({ command: 'mascot', args: 'style front' })
  expect(unknown?.text).toContain('No style called "front"')
})

test('an unknown option shows the usage and leaves the mascot as it was', async ($, on) => {
  mock.store(on)
  const unknown = await $.command.run({ command: 'mascot', args: 'dance' })
  expect(unknown?.text).toContain('No /mascot option "dance"')
  expect(unknown?.text).toContain('/mascot style <name>')
  // Still shown: a bare /mascot now hides it.
  const toggled = await $.command.run({ command: 'mascot', args: '' })
  expect(toggled?.text).toContain('hidden')
})

test('/mascot on, off, and help', async ($, on) => {
  mock.store(on)
  expect((await $.command.run({ command: 'mascot', args: 'off' }))?.text).toContain('hidden')
  expect((await $.command.run({ command: 'mascot', args: 'OFF' }))?.text).toContain('hidden')
  expect((await $.command.run({ command: 'mascot', args: 'on' }))?.text).toContain('back above the prompt')
  expect((await $.command.run({ command: 'mascot', args: 'help' }))?.text).toContain('/mascot on · /mascot off')
})
