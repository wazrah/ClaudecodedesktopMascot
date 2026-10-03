/**
 * The mascot: Claude's little critter in pixel art, one self-animating SVG per
 * mode. The band's frame runs no script, so every move is a CSS keyframe loop,
 * and the click reaction is SMIL timed on `hit.click`.
 *
 * Coordinates are art pixels on a 36 x 19 grid; UNIT sets CSS pixels per art pixel.
 */
import type { Mode } from '../../types'

const UNIT = 2.5
const COLS = 36
const ROWS = 19
export const WIDTH = COLS * UNIT
export const HEIGHT = ROWS * UNIT

/** Mid tones with no backdrop of their own, so they read on a light or a dark app. */
const INK = {
  body: '#d97757',
  eye: '#2b2622',
  deck: '#8b9099',
  lid: '#9aa0a8',
  edge: '#5d626b',
  glow: '#8fd0ff',
  mug: '#7fb0c8',
  mugShade: '#5a8aa3',
  steam: '#a3a9b2',
  zzz: '#9aa3ad',
  heart: '#e5484d',
}

/** A stretch of the loop, in percent, where a layer shows. */
type Span = readonly [from: number, to: number]
type Layer = 'armsType' | 'armsRest' | 'armsUp' | 'eyesOpen' | 'eyesClosed' | 'eyesHappy' | 'mugGround' | 'mugHeld' | 'zzz'
type Loop = { seconds: number; layers: Record<Layer, readonly Span[]> }

/**
 * Working: at the laptop, with a sip of coffee and a stretch along the way.
 * Idle: looks about, sips, naps, stretches, and starts over.
 */
const LOOPS: Record<Mode, Loop> = {
  working: {
    seconds: 30,
    layers: {
      armsType: [[0, 40], [53, 83], [93, 100]],
      armsRest: [[40, 53]],
      armsUp: [[83, 93]],
      eyesOpen: [[0, 40], [53, 83], [93, 100]],
      eyesClosed: [[40, 53]],
      eyesHappy: [[83, 93]],
      mugGround: [[0, 40], [53, 100]],
      mugHeld: [[40, 53]],
      zzz: [],
    },
  },
  idle: {
    seconds: 40,
    layers: {
      armsType: [],
      armsRest: [[0, 84], [92, 100]],
      armsUp: [[84, 92]],
      eyesOpen: [[0, 25], [92, 100]],
      eyesClosed: [[25, 84]],
      eyesHappy: [[84, 92]],
      mugGround: [[0, 25], [38, 100]],
      mugHeld: [[25, 38]],
      zzz: [[40, 84]],
    },
  },
}

const rect = (x: number, y: number, w: number, h: number, fill: string, extra = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${extra}/>`

const isOn = (spans: readonly Span[], at: number) => spans.some(([from, to]) => from <= at && at < to)

/** A layer's on and off over the loop: each keyframe holds until the next (step-end). */
function visibility(layer: Layer, spans: readonly Span[], seconds: number): string {
  const marks = [...new Set([0, 100, ...spans.flat()])].sort((a, b) => a - b)
  const frames = marks.map(at => `${at}%{opacity:${isOn(spans, at === 100 ? 99.99 : at) ? 1 : 0}}`).join('')
  return `@keyframes v-${layer}{${frames}}.v-${layer}{animation:v-${layer} ${seconds}s step-end infinite}`
}

const HEART = ['.X.X.', 'XXXXX', 'XXXXX', '.XXX.', '..X..']

function heart(left: number, top: number): string {
  return HEART.flatMap((row, y) =>
    [...row].map((cell, x) => (cell === 'X' ? rect(left + x, top + y, 1.02, 1.02, INK.heart) : '')),
  ).join('')
}

function styles(mode: Mode): string {
  const loop = LOOPS[mode]
  const layers = (Object.keys(loop.layers) as Layer[]).map(layer => visibility(layer, loop.layers[layer], loop.seconds))
  return [
    // The frame's page takes the app's colour scheme, or Chromium paints it an
    // opaque white behind the art; and no scrollbars from an inline SVG's gap.
    ':root{color-scheme:light dark}html,body{margin:0;overflow:hidden;background:transparent}svg{display:block}',
    // The lid swings once when the drawing starts, then the laptop settles.
    `.lid-swing{animation:lid-out ${LID_SECONDS}s step-end forwards}@keyframes lid-out{0%{opacity:1}100%{opacity:0}}`,
    `.lid-settled{opacity:0;animation:lid-in ${LID_SECONDS}s step-end forwards}@keyframes lid-in{0%{opacity:0}100%{opacity:1}}`,
    ...LID_STEPS.map((_, i) => {
      const from = Math.round(((i * FRAME_SECONDS) / LID_SECONDS) * 100)
      const to = i === LID_STEPS.length - 1 ? 100 : Math.round((((i + 1) * FRAME_SECONDS) / LID_SECONDS) * 100)
      const keys = i === 0 ? `0%{opacity:1}${to}%{opacity:0}` : `0%{opacity:0}${from}%{opacity:1}${to}%{opacity:${to === 100 ? 1 : 0}}`
      return `@keyframes lid${i}{${keys}}.lid${i}{animation:lid${i} ${LID_SECONDS}s step-end forwards}`
    }),
    ...layers,
    '#hit{cursor:pointer}',
    '#eyeLift{transition:transform .2s}',
    'svg:hover #eyeLift{transform:translateY(-0.6px)}',
    '.blink{transform-box:fill-box;transform-origin:center;animation:blink 4.3s infinite}',
    '@keyframes blink{0%,93%,98%,100%{transform:scaleY(1)}95%{transform:scaleY(.15)}}',
    '.tap{animation:tap .36s step-end infinite}',
    '.tap2{animation-delay:-.18s}',
    '@keyframes tap{0%{transform:translateY(0)}50%{transform:translateY(.8px)}}',
    '.steam{animation:steam 1.6s ease-out infinite;opacity:0}',
    '.steam2{animation-delay:-.8s}',
    '@keyframes steam{0%{opacity:0;transform:translateY(0)}30%{opacity:.8}100%{opacity:0;transform:translateY(-1.6px)}}',
    '.z{animation:drift 3s ease-in-out infinite;opacity:0}',
    '.z2{animation-delay:-1s}',
    '.z3{animation-delay:-2s}',
    '@keyframes drift{0%{opacity:0;transform:translate(0,0)}25%,75%{opacity:1}100%{opacity:0;transform:translate(1.5px,-2.5px)}}',
    '.glow{animation:glow 3.2s step-end infinite}',
    '@keyframes glow{0%{opacity:1}40%{opacity:.8}55%{opacity:1}80%{opacity:.88}}',
    // The idle look-about: a glance left, back, a glance right, back.
    '.look{animation:look 40s step-end infinite}',
    '@keyframes look{0%{transform:translateX(0)}5%{transform:translateX(-1px)}10%{transform:translateX(0)}15%{transform:translateX(1px)}20%{transform:translateX(0)}}',
    '@media (prefers-reduced-motion:reduce){.tap,.steam,.z,.glow,.blink,.look{animation:none}.lid-swing{display:none}.lid-settled{opacity:1;animation:none}}',
  ].join('')
}

const DECK = rect(22, 16.8, 9, 1.2, INK.deck) + rect(22, 17.6, 9, 0.4, INK.edge)
const OPEN =
  DECK +
  `<polygon points="30.4,16.9 31.6,16.9 33.4,10.4 32.2,10.4" fill="${INK.edge}"/>` +
  `<polygon class="glow" points="30,16.8 30.6,16.8 32.4,10.6 31.8,10.6" fill="${INK.glow}"/>`
const SHUT = rect(22, 16.6, 9, 0.6, INK.lid) + rect(22, 17.2, 9, 0.8, INK.edge)

/** The lid on its hinge at the deck's far end, at an angle from the deck; the screen lit while it faces him. */
function lidAt(angle: number): string {
  const hinge = { x: 31, y: 16.85 }
  const length = 6.7
  const thick = 1.2
  const a = (angle * Math.PI) / 180
  const along = { x: Math.cos(a), y: -Math.sin(a) }
  const back = { x: Math.sin(a), y: Math.cos(a) }
  const at = (s: number, t: number) =>
    `${Math.round((hinge.x + along.x * s + back.x * t) * 100) / 100},${Math.round((hinge.y + along.y * s + back.y * t) * 100) / 100}`
  return (
    `<polygon points="${at(0, 0)} ${at(length, 0)} ${at(length, thick)} ${at(0, thick)}" fill="${INK.edge}"/>` +
    `<polygon class="glow" points="${at(0.3, 0)} ${at(length - 0.2, 0)} ${at(length - 0.2, -0.5)} ${at(0.3, -0.5)}" fill="${INK.glow}"/>`
  )
}

/** The laptop from open to shut in four steps: the lid tips past upright, then down onto the deck. */
const LID_STEPS = [OPEN, DECK + lidAt(110), DECK + lidAt(145), SHUT] as const
const FRAME_SECONDS = 0.22
const LID_SECONDS = 1.1

/** The lid swings shut for a break or open for work, then the laptop stays as it landed. */
function laptop(mode: Mode): string {
  const steps = mode === 'idle' ? LID_STEPS : [...LID_STEPS].reverse()
  const swing = steps.map((step, i) => `<g class="lid${i}">${step}</g>`).join('')
  return `<g class="lid-swing">${swing}</g><g class="lid-settled">${mode === 'idle' ? SHUT : OPEN}</g>`
}

function mug(left: number, top: number): string {
  return (
    `<rect x="${left - 0.9}" y="${top + 0.8}" width="1.1" height="1.6" fill="none" stroke="${INK.mug}" stroke-width="0.55"/>` +
    rect(left, top, 3, 3.5, INK.mug) +
    rect(left, top + 2.8, 3, 0.7, INK.mugShade)
  )
}

const EYES_HAPPY = `<path d="M8.5 11.6L9.5 10.6L10.5 11.6M15.5 11.6L16.5 10.6L17.5 11.6" fill="none" stroke="${INK.eye}" stroke-width="0.7" shape-rendering="geometricPrecision"/>`

const CLICK = 'begin="hit.click" restart="always"'

export function mascotSvg(mode: Mode): string {
  // At the laptop the eyes sit one pixel over, on the screen.
  const gaze = mode === 'working' ? ' transform="translate(1 0)"' : ''
  const look = mode === 'idle' ? ' class="look"' : ''
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${COLS} ${ROWS}" width="${WIDTH}" height="${HEIGHT}" shape-rendering="crispEdges">`,
    `<style>${styles(mode)}</style>`,
    laptop(mode),
    `<g class="v-mugGround">${mug(1.5, 14.5)}</g>`,
    `<g id="hop"><animateTransform attributeName="transform" type="translate" values="0 0;0 -2.5;0 0;0 -0.8;0 0" keyTimes="0;0.3;0.6;0.8;1" dur="0.6s" ${CLICK}/>`,
    // Body and legs.
    rect(7, 8, 12, 8, INK.body),
    rect(8, 16, 1, 2, INK.body) + rect(10, 16, 1, 2, INK.body) + rect(15, 16, 1, 2, INK.body) + rect(17, 16, 1, 2, INK.body),
    // Arms: tapping at the keys, at rest, or up in a stretch.
    `<g class="v-armsType">${rect(5, 12, 2, 2, INK.body, ' class="tap"')}${rect(19, 12, 3, 2, INK.body, ' class="tap tap2"')}</g>`,
    `<g class="v-armsRest">${rect(5, 12, 2, 2, INK.body)}${rect(19, 12, 2, 2, INK.body)}</g>`,
    `<g class="v-armsUp">${rect(5, 5, 2, 5, INK.body)}${rect(19, 5, 2, 5, INK.body)}</g>`,
    '<g id="eyeLift">',
    `<g id="eyesNormal"><set attributeName="opacity" to="0" dur="1.6s" ${CLICK}/>`,
    `<g class="v-eyesOpen"><g${gaze}><g${look}><g class="blink">${rect(9, 10, 1, 2, INK.eye)}${rect(16, 10, 1, 2, INK.eye)}</g></g></g></g>`,
    `<g class="v-eyesClosed">${rect(8.6, 11.2, 1.8, 0.6, INK.eye)}${rect(15.6, 11.2, 1.8, 0.6, INK.eye)}</g>`,
    `<g class="v-eyesHappy">${EYES_HAPPY}</g>`,
    '</g>',
    `<g id="eyesClick" opacity="0"><set attributeName="opacity" to="1" dur="1.6s" ${CLICK}/>${EYES_HAPPY}</g>`,
    '</g>',
    // The coffee break: the mug comes up in the left hand, steaming.
    `<g class="v-mugHeld">${mug(6, 11.5)}${rect(5, 12.3, 2, 2, INK.body)}`,
    `${rect(7, 9.6, 0.6, 1.4, INK.steam, ' class="steam"')}${rect(8.2, 9.2, 0.6, 1.4, INK.steam, ' class="steam steam2"')}</g>`,
    '</g>',
    `<g class="v-zzz"><g><set attributeName="opacity" to="0" dur="3s" ${CLICK}/>`,
    ...[
      [21, 8, 2.4, ''],
      [23, 5.6, 3, ' z2'],
      [25.5, 3.2, 3.6, ' z3'],
    ].map(([x, y, size, cls]) => `<text class="z${cls}" x="${x}" y="${y}" font-size="${size}" font-weight="700" font-family="ui-monospace,Menlo,Consolas,monospace" fill="${INK.zzz}">z</text>`),
    '</g></g>',
    `<g id="heart" opacity="0">`,
    `<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.7;1" dur="1.6s" ${CLICK}/>`,
    `<animateTransform attributeName="transform" type="translate" values="0 1;0 -1;0 -2.5" keyTimes="0;0.3;1" dur="1.6s" ${CLICK}/>`,
    heart(10.5, 1.5),
    '</g>',
    // On top of everything, so a click anywhere on the critter lands.
    `<rect id="hit" x="3" y="1" width="21" height="18" fill="transparent"/>`,
    '</svg>',
  ].join('')
}
