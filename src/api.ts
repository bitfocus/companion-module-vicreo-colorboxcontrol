export const GRADE_WHEELS = [
  "lift",
  "gamma",
  "gain",
  "offset",
  "shadow",
  "midtone",
  "highlight",
] as const;

export const GRADE_COMPONENTS = ["r", "g", "b", "master"] as const;

export const SOURCES = ["rec709", "hlg", "slog2", "slog3"] as const;

export type GradeWheel = (typeof GRADE_WHEELS)[number];
export type GradeComponent = (typeof GRADE_COMPONENTS)[number];
export type SourceValue = (typeof SOURCES)[number];

export const COMMON_PATHS = [
  "rgb/r",
  "rgb/g",
  "rgb/b",
  "temp",
  "tempDelta",
  "tint",
  ...GRADE_WHEELS.flatMap((wheel) =>
    GRADE_COMPONENTS.map((component) => `grade/${wheel}/${component}`),
  ),
  "saturation",
  "source",
  "output",
];

// 'source' and 'output' are enums: they have no default, so they can be set but
// never reset.
export const NUMERIC_PATHS = COMMON_PATHS.filter(
  (path) => path !== "source" && path !== "output",
);

export const RGB_PATHS = ["rgb/r", "rgb/g", "rgb/b"];

export function pathVariableId(path: string): string {
  return `control_${path.replaceAll("/", "_")}`;
}

export function pathVariable(path: string): string {
  return `$(ColorBox:${pathVariableId(path)})`;
}

export function clampPathValue(path: string, value: number): number {
  const teranex = teranexNumber(path);
  if (teranex) return clamp(Math.round(value), teranex.min, teranex.max);
  if (path === "temp") return clamp(value, 1563, 5600);
  if (path === "tint" || path === "saturation") return clamp(value, -1, 1);
  if (path.startsWith("rgb/")) return clamp(value, 0.5, 1.5);
  if (path.startsWith("grade/")) return clamp(value, -1, 1);
  return value;
}

export function pathStep(path: string): number {
  const teranex = teranexNumber(path);
  if (teranex) return teranex.step;
  if (path === "temp" || path === "tempDelta") return 10;
  if (path === "tint" || path === "saturation") return 0.01;
  if (path.startsWith("rgb/")) return 0.01;
  if (path.startsWith("grade/")) return 0.01;
  return 1;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Blackmagic Teranex (driver "bmd-teranex"). A Teranex box takes its own paths
// (welcome.teranexPaths in the app's API) instead of the grade paths above, in
// the Teranex's own device units. Reads are the device's live values, so front
// panel changes show up in variables and feedbacks too.
// ---------------------------------------------------------------------------

export const TERANEX_DRIVER = "bmd-teranex";

export type TeranexNumber = {
  path: string;
  label: string;
  min: number;
  max: number;
  default: number;
  /** Knob step per detent. */
  step: number;
};

export const TERANEX_PROCAMP: TeranexNumber[] = [
  {
    path: "procamp/gain",
    label: "Gain",
    min: -60,
    max: 60,
    default: 0,
    step: 1,
  },
  {
    path: "procamp/black",
    label: "Black",
    min: -30,
    max: 30,
    default: 0,
    step: 1,
  },
  {
    path: "procamp/saturation",
    label: "Sat",
    min: -60,
    max: 60,
    default: 0,
    step: 1,
  },
  {
    path: "procamp/hue",
    label: "Hue",
    min: -179,
    max: 180,
    default: 0,
    step: 1,
  },
  {
    path: "procamp/ry",
    label: "R-Y",
    min: -200,
    max: 200,
    default: 0,
    step: 2,
  },
  {
    path: "procamp/by",
    label: "B-Y",
    min: -200,
    max: 200,
    default: 0,
    step: 2,
  },
  {
    path: "procamp/sharp",
    label: "Sharp",
    min: -50,
    max: 50,
    default: 0,
    step: 1,
  },
];

export const TERANEX_COLOR: TeranexNumber[] = [
  {
    path: "adjust/red",
    label: "Red",
    min: -200,
    max: 200,
    default: 0,
    step: 2,
  },
  {
    path: "adjust/green",
    label: "Green",
    min: -200,
    max: 200,
    default: 0,
    step: 2,
  },
  {
    path: "adjust/blue",
    label: "Blue",
    min: -200,
    max: 200,
    default: 0,
    step: 2,
  },
];

export const TERANEX_CLIP: TeranexNumber[] = [
  {
    path: "adjust/lumalow",
    label: "Luma low",
    min: 4,
    max: 1018,
    default: 4,
    step: 4,
  },
  {
    path: "adjust/lumahigh",
    label: "Luma high",
    min: 5,
    max: 1019,
    default: 1019,
    step: 4,
  },
  {
    path: "adjust/chromalow",
    label: "Chroma low",
    min: 4,
    max: 1018,
    default: 4,
    step: 4,
  },
  {
    path: "adjust/chromahigh",
    label: "Chroma high",
    min: 5,
    max: 1019,
    default: 1019,
    step: 4,
  },
];

export const TERANEX_FILL: TeranexNumber[] = [
  {
    path: "adjust/filly",
    label: "Fill Y",
    min: 64,
    max: 940,
    default: 64,
    step: 4,
  },
  {
    path: "adjust/fillcb",
    label: "Fill Cb",
    min: 64,
    max: 960,
    default: 512,
    step: 4,
  },
  {
    path: "adjust/fillcr",
    label: "Fill Cr",
    min: 64,
    max: 960,
    default: 512,
    step: 4,
  },
];

export const TERANEX_RATE: TeranexNumber = {
  path: "testpattern/rate",
  label: "Rate",
  min: -3,
  max: 3,
  default: 0,
  step: 1,
};

export const TERANEX_NUMBERS: TeranexNumber[] = [
  ...TERANEX_PROCAMP,
  ...TERANEX_COLOR,
  ...TERANEX_CLIP,
  ...TERANEX_FILL,
  TERANEX_RATE,
];

/** Groups for the "reset group" action - each maps to the app's resetControls with those paths. */
export const TERANEX_RESET_GROUPS: Record<
  string,
  { label: string; paths: string[] }
> = {
  procamp: { label: "Proc amp", paths: TERANEX_PROCAMP.map((n) => n.path) },
  color: { label: "RGB color", paths: TERANEX_COLOR.map((n) => n.path) },
  clip: { label: "Clipping", paths: TERANEX_CLIP.map((n) => n.path) },
  fill: { label: "Aspect fill", paths: TERANEX_FILL.map((n) => n.path) },
};

/** Device value -> label. Values are sent in the device's spelling. */
export const TERANEX_PATTERNS: Record<string, string> = {
  None: "Off",
  Black: "Black",
  SMPTEBars: "SMPTE bars",
  Bars: "Bars",
  Multiburst: "Multiburst",
  Grid: "Grid",
};

export const TERANEX_NO_SIGNAL: Record<string, string> = {
  Black: "Black",
  Bars: "Bars",
};

export const TERANEX_TONES: Record<string, string> = {
  None: "Off",
  Tone750Hz: "750 Hz",
  Tone1500Hz: "1.5 kHz",
  Tone3KHz: "3 kHz",
  Tone6KHz: "6 kHz",
};

export const TERANEX_PRESET_COUNT = 6;

export function teranexPresetNamePath(preset: number): string {
  return `preset/${preset}/name`;
}

/** Every readable Teranex path - one Companion variable each. */
export const TERANEX_PATHS = [
  ...TERANEX_NUMBERS.map((n) => n.path),
  "testpattern/pattern",
  "testpattern/nosignal",
  "testpattern/tone",
  "testpattern/motion",
  ...Array.from({ length: TERANEX_PRESET_COUNT }, (_, i) =>
    teranexPresetNamePath(i + 1),
  ),
];

/** Paths whose value stays text even when it looks numeric (a preset called "2024"). */
export const TEXT_PATHS = new Set([
  "source",
  "output",
  "testpattern/pattern",
  "testpattern/nosignal",
  "testpattern/tone",
  ...Array.from({ length: TERANEX_PRESET_COUNT }, (_, i) =>
    teranexPresetNamePath(i + 1),
  ),
]);

const TERANEX_NUMBER_BY_PATH = new Map(TERANEX_NUMBERS.map((n) => [n.path, n]));

export function teranexNumber(path: string): TeranexNumber | undefined {
  return TERANEX_NUMBER_BY_PATH.get(path);
}
