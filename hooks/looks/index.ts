/**
 * The mascot's looks, picked with `/mascot style <name>`: each draws one
 * self-animating SVG per mode at its own size.
 */
import type { LookName, Mode } from '../../types'
import * as behind from './behind'
import * as classic from './classic'

export type Look = { description: string; width: number; height: number; svg: (mode: Mode) => string }

export const LOOKS: Record<LookName, Look> = {
  classic: { description: 'the laptop at its side', width: classic.WIDTH, height: classic.HEIGHT, svg: classic.mascotSvg },
  behind: { description: 'behind the laptop, eyes over the lid', width: behind.WIDTH, height: behind.HEIGHT, svg: behind.mascotSvg },
}

export const LOOK_NAMES = Object.keys(LOOKS) as LookName[]
export const DEFAULT_LOOK: LookName = 'classic'

/** A look's name as a person might type it, or as the store holds it. */
export function findLook(name: unknown): LookName | undefined {
  const s = typeof name === 'string' ? name.trim().toLowerCase() : ''
  return LOOK_NAMES.find(look => look === s)
}
