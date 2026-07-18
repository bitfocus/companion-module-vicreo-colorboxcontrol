export const GRADE_WHEELS = [
  'lift',
  'gamma',
  'gain',
  'offset',
  'shadow',
  'midtone',
  'highlight',
] as const

export const GRADE_COMPONENTS = ['r', 'g', 'b', 'master'] as const

export const SOURCES = ['rec709', 'hlg', 'slog2', 'slog3'] as const

export type GradeWheel = (typeof GRADE_WHEELS)[number]
export type GradeComponent = (typeof GRADE_COMPONENTS)[number]
export type SourceValue = (typeof SOURCES)[number]

export const COMMON_PATHS = [
  'rgb/r',
  'rgb/g',
  'rgb/b',
  'temp',
  'tempDelta',
  ...GRADE_WHEELS.flatMap((wheel) => GRADE_COMPONENTS.map((component) => `grade/${wheel}/${component}`)),
  'source',
  'output',
]

export function clampPathValue(path: string, value: number): number {
  if (path === 'temp') return clamp(value, 1563, 5600)
  if (path.startsWith('rgb/')) return clamp(value, 0.5, 1.5)
  if (path.startsWith('grade/')) return clamp(value, -1, 1)
  return value
}

export function pathStep(path: string): number {
  if (path === 'temp' || path === 'tempDelta') return 10
  if (path.startsWith('rgb/')) return 0.01
  if (path.startsWith('grade/')) return 0.01
  return 1
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function toNumberOrNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}
