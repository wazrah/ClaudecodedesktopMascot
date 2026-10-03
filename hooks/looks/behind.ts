/**
 * The `behind` look: Claude's little critter sits behind a laptop, seen from
 * the back of the lid, its eyes peeking over the top. One self-animating SVG
 * per mode. The band's frame runs no script, so every move is a CSS keyframe
 * timeline, and the click reaction is SMIL timed on `hit.click`.
 *
 * Each drawing opens with a four-frame intro (lifting the lid for work,
 * pushing it shut for a break), then loops. Coordinates are art pixels on a
 * 28 x 19 grid; UNIT sets CSS pixels per art pixel.
 */
import type { Mode } from '../../types'

const UNIT = 2.5
const COLS = 28
const ROWS = 19
export const WIDTH = COLS * UNIT
export const HEIGHT = ROWS * UNIT

/** Mid tones with no backdrop of their own, so they read on a light or a dark app. */
const INK = {
  body: '#d97757',
  eye: '#2b2622',
  lid: '#8b9099',
  logo: '#b3b8c0',
  edge: '#5d626b',
  glow: '#8fd0ff',
  mug: '#7fb0c8',
  mugShade: '#5a8aa3',
  steam: '#a3a9b2',
  zzz: '#9aa3ad',
  heart: '#e5484d',
}

/** The lid seen from the back: its height at each frame from open to shut, on a hinge at the base. */
const LID_STEPS = [5, 3.4, 1.8, 0.8] as const
const HINGE = 17
const FRAME_SECONDS = 0.22
const INTRO_SECONDS = 1.1

/** A stretch of the loop where a layer shows, in seconds from the loop's start. */
type Span = readonly [from: number, to: number]
const LAYERS = [
  'type', 'rest', 'up', 'rightKeys', 'rightRest', 'reach', 'lift', 'sip',
  'eyesDown', 'eyesOpen', 'eyesClosed', 'eyesSleep', 'eyesHappy', 'mugGround', 'zzz',
] as const
type Layer = (typeof LAYERS)[number]
type Loop = { seconds: number; layers: Partial<Record<Layer, readonly Span[]>> }

/** A coffee break from `at`: reach for the mug, lift it, sip, lower it, let go. */
function coffee(at: number, sipping = 2.8) {
  const up = at + 0.8
  const down = up + sipping
  return {
    reach: [[at, at + 0.4], [down + 0.4, down + 0.8]] as Span[],
    lift: [[at + 0.4, up], [down, down + 0.4]] as Span[],
    sip: [[up, down]] as Span[],
    whole: [at, down + 0.8] as Span,
    watching: [[at, up], [down, down + 0.8]] as Span[],
  }
}

const WORK_COFFEE = coffee(13)
const IDLE_COFFEE = coffee(9)

/**
 * Working: both hands on the keys in bursts, a sip with the other hand still
 * on the keyboard, then a stretch. Idle: looks about, sips, naps, wakes and
 * stretches.
 */
const LOOPS: Record<Mode, Loop> = {
  working: {
    seconds: 32,
    layers: {
      type: [[0, 13], [17.4, 27], [29.6, 32]],
      rightKeys: [WORK_COFFEE.whole],
      reach: WORK_COFFEE.reach,
      lift: WORK_COFFEE.lift,
      sip: WORK_COFFEE.sip,
      up: [[27, 29.6]],
      eyesDown: [[0, 13], [17.4, 27], [29.6, 32]],
      eyesOpen: WORK_COFFEE.watching,
      eyesClosed: WORK_COFFEE.sip,
      eyesHappy: [[27, 29.6]],
      mugGround: [[0, 13.4], [17, 32]],
    },
  },
  idle: {
    seconds: 42,
    layers: {
      rest: [[0, 9], [13.4, 34.6], [37, 42]],
      rightRest: [IDLE_COFFEE.whole],
      reach: IDLE_COFFEE.reach,
      lift: IDLE_COFFEE.lift,
      sip: IDLE_COFFEE.sip,
      up: [[34.6, 37]],
      eyesOpen: [[0, 9.8], [12.6, 16], [34, 34.6], [37, 42]],
      eyesClosed: IDLE_COFFEE.sip,
      eyesSleep: [[16, 34]],
      eyesHappy: [[34.6, 37]],
      mugGround: [[0, 9.4], [13, 42]],
      zzz: [[17, 34]],
    },
  },
}

const round = (n: number) => Math.round(n * 100) / 100
const rect = (x: number, y: number, w: number, h: number, fill: string, extra = '') =>
  `<rect x="${round(x)}" y="${round(y)}" width="${round(w)}" height="${round(h)}" fill="${fill}"${extra}/>`

const pct = (seconds: number, total: number) => Math.round((seconds / total) * 10000) / 100
const isOn = (spans: readonly Span[], at: number) => spans.some(([from, to]) => from <= at && at < to)

/** A layer's on and off over the loop: each keyframe holds until the next (step-end). */
function visibility(layer: Layer, spans: readonly Span[], seconds: number): string {
  const marks = [...new Set([0, seconds, ...spans.flat()])].sort((a, b) => a - b)
  const frames = marks.map(at => `${pct(at, seconds)}%{opacity:${isOn(spans, at === seconds ? seconds - 0.001 : at) ? 1 : 0}}`).join('')
  return `@keyframes v-${layer}{${frames}}.v-${layer}{animation:v-${layer} ${seconds}s step-end infinite}`
}

/** Keyframes for moves at given seconds of a loop, each held until the next. */
function timeline(name: string, seconds: number, steps: readonly [at: number, value: string][]): string {
  return `@keyframes ${name}{${steps.map(([at, value]) => `${pct(at, seconds)}%{transform:${value}}`).join('')}}`
}

function styles(mode: Mode): string {
  const loop = LOOPS[mode]
  // Every layer gets its rule, a mode's unused ones staying off throughout.
  const layers = LAYERS.map(layer => visibility(layer, loop.layers[layer] ?? [], loop.seconds))
  const frames = LID_STEPS.map((_, i) => {
    const from = pct(i * FRAME_SECONDS, INTRO_SECONDS)
    const to = i === LID_STEPS.length - 1 ? 100 : pct((i + 1) * FRAME_SECONDS, INTRO_SECONDS)
    const keys = from === 0 ? `0%{opacity:1}${to}%{opacity:0}` : `0%{opacity:0}${from}%{opacity:1}${to}%{opacity:${to === 100 ? 1 : 0}}`
    return `@keyframes f${i}{${keys}}.f${i}{animation:f${i} ${INTRO_SECONDS}s step-end forwards}`
  })
  return [
    // The frame's page takes the app's colour scheme, or Chromium paints it an
    // opaque white behind the art; and no scrollbars from an inline SVG's gap.
    ':root{color-scheme:light dark}html,body{margin:0;overflow:hidden;background:transparent}svg{display:block}',
    // The intro plays once, then hands over to the loop.
    `.intro{animation:intro-out ${INTRO_SECONDS}s step-end forwards}@keyframes intro-out{0%{opacity:1}100%{opacity:0}}`,
    `.loop{opacity:0;animation:loop-in ${INTRO_SECONDS}s step-end forwards}@keyframes loop-in{0%{opacity:0}100%{opacity:1}}`,
    ...frames,
    ...layers,
    '#hit{cursor:pointer}',
    '#eyeLift{transition:transform .2s}',
    'svg:hover #eyeLift{transform:translateY(-0.6px)}',
    '.blink{transform-box:fill-box;transform-origin:center;animation:blink 4.3s infinite}',
    '@keyframes blink{0%,93%,98%,100%{transform:scaleY(1)}95%{transform:scaleY(.15)}}',
    // Typing in bursts: both hands, out of step, then a pause to read.
    '.tapL{animation:tapL 2.4s step-end infinite}.tapR{animation:tapR 2.4s step-end infinite}',
    '@keyframes tapL{0%{transform:translateY(0)}8%{transform:translateY(.7px)}16%{transform:translateY(0)}32%{transform:translateY(.7px)}40%{transform:translateY(0)}56%{transform:translateY(.7px)}64%{transform:translateY(0)}}',
    '@keyframes tapR{0%{transform:translateY(0)}24%{transform:translateY(.7px)}32%{transform:translateY(0)}44%{transform:translateY(.7px)}52%{transform:translateY(0)}68%{transform:translateY(.7px)}76%{transform:translateY(0)}}',
    // Reading the screen: the eyes sweep left to right now and then.
    '.read{animation:read 6s step-end infinite}',
    '@keyframes read{0%{transform:translateX(0)}55%{transform:translateX(-.6px)}68%{transform:translateX(0)}80%{transform:translateX(.6px)}92%{transform:translateX(0)}}',
    '.steam{animation:steam 1.6s ease-out infinite;opacity:0}',
    '.steam2{animation-delay:-.8s}',
    '@keyframes steam{0%{opacity:0;transform:translateY(0)}30%{opacity:.8}100%{opacity:0;transform:translateY(-1.6px)}}',
    '.z{animation:drift 3s ease-in-out infinite;opacity:0}',
    '.z2{animation-delay:-1s}',
    '.z3{animation-delay:-2s}',
    '@keyframes drift{0%{opacity:0;transform:translate(0,0)}25%,75%{opacity:1}100%{opacity:0;transform:translate(1.5px,-2.5px)}}',
    '.glow{animation:glow 3.2s step-end infinite}',
    '@keyframes glow{0%{opacity:1}40%{opacity:.75}55%{opacity:1}80%{opacity:.85}}',
    // Idle: a slow breath, and a look about: left, right, up at you.
    '.breathe{animation:breathe 4s ease-in-out infinite}',
    '@keyframes breathe{0%,100%{transform:translateY(0)}50%{transform:translateY(.35px)}}',
    `.look{animation:look ${LOOPS.idle.seconds}s step-end infinite}`,
    timeline('look', LOOPS.idle.seconds, [
      [0, 'translate(0,0)'], [2.5, 'translate(-1px,0)'], [3.7, 'translate(0,0)'], [5, 'translate(1px,0)'],
      [6.2, 'translate(0,0)'], [7, 'translate(0,-.6px)'], [8.2, 'translate(0,0)'], [38, 'translate(-1px,0)'], [39.4, 'translate(0,0)'],
    ]),
    '@media (prefers-reduced-motion:reduce){.tapL,.tapR,.read,.steam,.z,.glow,.blink,.look,.breathe{animation:none}.intro{display:none}.loop{opacity:1;animation:none}}',
  ].join('')
}

/** The lid from the back at a height, and the base it is hinged to. */
const lid = (height: number) =>
  rect(8, HINGE - height, 10, height, INK.lid) + (height > 2 ? rect(12.5, HINGE - height + 1.6, 1, 1, INK.logo) : '')
const BASE = rect(7.4, HINGE, 11.2, 1, INK.edge)

/** Both hands on the lid's top corners, as when lifting or shutting it. */
const handsOnLid = (height: number) => rect(7.2, HINGE - height - 1, 2, 1.6, INK.body) + rect(16.8, HINGE - height - 1, 2, 1.6, INK.body)

function mug(left: number, top: number): string {
  return (
    `<rect x="${round(left - 0.9)}" y="${round(top + 0.8)}" width="1.1" height="1.6" fill="none" stroke="${INK.mug}" stroke-width="0.55"/>` +
    rect(left, top, 3, 3.5, INK.mug) +
    rect(left, top + 2.8, 3, 0.7, INK.mugShade)
  )
}

const eyesAt = (y: number, extra = '') => `<g${extra}>${rect(9, y, 1, 2, INK.eye)}${rect(16, y, 1, 2, INK.eye)}</g>`
const EYES_HAPPY = `<path d="M8.5 11.6L9.5 10.6L10.5 11.6M15.5 11.6L16.5 10.6L17.5 11.6" fill="none" stroke="${INK.eye}" stroke-width="0.7" shape-rendering="geometricPrecision"/>`
const eyeLine = (y: number) => rect(8.6, y, 1.8, 0.6, INK.eye) + rect(15.6, y, 1.8, 0.6, INK.eye)

/** The four frames of the lid moving: shut for a break, lifted for work. */
function intro(mode: Mode): string {
  const steps = mode === 'idle' ? LID_STEPS : [...LID_STEPS].reverse()
  return steps
    .map((height, i) => {
      const isLast = i === steps.length - 1
      const eyes = mode === 'idle' && isLast ? EYES_HAPPY : mode === 'working' && i === 0 ? eyesAt(10) : eyesAt(10.6)
      return `<g class="f${i}">${eyes}${lid(height)}${handsOnLid(height)}</g>`
    })
    .join('')
}

const CLICK = 'begin="hit.click" restart="always"'
const HOP = `<animateTransform attributeName="transform" type="translate" values="0 0;0 -2.5;0 0;0 -0.8;0 0" keyTimes="0;0.3;0.6;0.8;1" dur="0.6s" ${CLICK}/>`

export function mascotSvg(mode: Mode): string {
  const isWorking = mode === 'working'
  const breathe = isWorking ? '' : ' class="breathe"'
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${COLS} ${ROWS}" width="${WIDTH}" height="${HEIGHT}" shape-rendering="crispEdges">`,
    `<style>${styles(mode)}</style>`,
    `<g class="v-mugGround">${mug(1.5, 14.5)}</g>`,
    // Behind the lid: the body, the eyes, and the hands on the keys.
    `<g id="hop">${HOP}<g${breathe}>`,
    rect(8, 16, 1, 2, INK.body) + rect(10, 16, 1, 2, INK.body) + rect(15, 16, 1, 2, INK.body) + rect(17, 16, 1, 2, INK.body),
    rect(7, 8, 12, 8, INK.body),
    '<g class="loop">',
    isWorking ? rect(8, 11.4, 10, 0.6, INK.glow, ' class="glow" opacity=".22"') : '',
    '<g id="eyeLift">',
    `<g id="eyesNormal"><set attributeName="opacity" to="0" dur="1.6s" ${CLICK}/>`,
    `<g class="v-eyesDown"><g class="read">${eyesAt(10.6, ' class="blink"')}</g></g>`,
    `<g class="v-eyesOpen"><g${isWorking ? '' : ' class="look"'}>${eyesAt(10, ' class="blink"')}</g></g>`,
    `<g class="v-eyesClosed">${eyeLine(11.2)}</g>`,
    `<g class="v-eyesSleep">${eyeLine(11.7)}</g>`,
    `<g class="v-eyesHappy">${EYES_HAPPY}</g>`,
    '</g>',
    `<g id="eyesClick" opacity="0"><set attributeName="opacity" to="1" dur="1.6s" ${CLICK}/>${EYES_HAPPY}</g>`,
    '</g>',
    `<g class="v-type">${rect(5.6, 12.8, 2.6, 1.6, INK.body, ' class="tapL"')}${rect(17.8, 12.8, 2.6, 1.6, INK.body, ' class="tapR"')}</g>`,
    `<g class="v-rightKeys">${rect(17.8, 12.8, 2.6, 1.6, INK.body)}</g>`,
    '</g></g></g>',
    // The laptop: open for work, shut on a break; the base is always there.
    `<g class="loop">${lid(isWorking ? LID_STEPS[0] : LID_STEPS[3])}</g>`,
    BASE,
    `<g class="intro">${intro(mode)}</g>`,
    // In front of the lid: arms at rest or up, and the coffee hand.
    `<g id="hop2">${HOP}<g${breathe}><g class="loop">`,
    `<g class="v-rest">${rect(5, 12, 2, 2, INK.body)}${rect(19, 12, 2, 2, INK.body)}</g>`,
    `<g class="v-rightRest">${rect(19, 12, 2, 2, INK.body)}</g>`,
    `<g class="v-up">${rect(5, 5, 2, 5, INK.body)}${rect(19, 5, 2, 5, INK.body)}</g>`,
    `<g class="v-reach">${rect(4.6, 13.4, 2.6, 1.6, INK.body)}</g>`,
    `<g class="v-lift">${mug(3.8, 12.2)}${rect(4.8, 12.8, 2.4, 1.6, INK.body)}</g>`,
    `<g class="v-sip">${mug(5.6, 9.6)}${rect(4.9, 10.6, 2.2, 1.8, INK.body)}`,
    `${rect(6.6, 7.8, 0.6, 1.4, INK.steam, ' class="steam"')}${rect(7.8, 7.4, 0.6, 1.4, INK.steam, ' class="steam steam2"')}</g>`,
    '</g></g></g>',
    `<g class="v-zzz"><g><set attributeName="opacity" to="0" dur="3s" ${CLICK}/>`,
    ...[
      [20.5, 8, 2.4, ''],
      [22.5, 5.6, 3, ' z2'],
      [24.6, 3.2, 3.4, ' z3'],
    ].map(([x, y, size, cls]) => `<text class="z${cls}" x="${x}" y="${y}" font-size="${size}" font-weight="700" font-family="ui-monospace,Menlo,Consolas,monospace" fill="${INK.zzz}">z</text>`),
    '</g></g>',
    `<g id="heart" opacity="0">`,
    `<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.7;1" dur="1.6s" ${CLICK}/>`,
    `<animateTransform attributeName="transform" type="translate" values="0 1;0 -1;0 -2.5" keyTimes="0;0.3;1" dur="1.6s" ${CLICK}/>`,
    heart(10.5, 1.5),
    '</g>',
    // On top of everything, so a click anywhere on the critter lands.
    `<rect id="hit" x="3" y="1" width="18" height="18" fill="transparent"/>`,
    '</svg>',
  ].join('')
}

const HEART = ['.X.X.', 'XXXXX', 'XXXXX', '.XXX.', '..X..']

function heart(left: number, top: number): string {
  return HEART.flatMap((row, y) =>
    [...row].map((cell, x) => (cell === 'X' ? rect(left + x, top + y, 1.02, 1.02, INK.heart) : '')),
  ).join('')
}
