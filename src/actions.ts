import type ModuleInstance from "./main.js";
import {
  GRADE_COMPONENTS,
  GRADE_WHEELS,
  NUMERIC_PATHS,
  RGB_PATHS,
  SOURCES,
  TERANEX_DRIVER,
  TERANEX_NO_SIGNAL,
  TERANEX_NUMBERS,
  TERANEX_PATTERNS,
  TERANEX_PRESET_COUNT,
  TERANEX_RESET_GROUPS,
  TERANEX_TONES,
  clampPathValue,
  pathStep,
  teranexNumber,
  teranexPresetNamePath,
} from "./api.js";

type CommonActionOptions = {
  box: string;
};

export type ActionsSchema = {
  refresh_boxes: { options: Record<string, never> };
  select_box: { options: { box: string } };
  request_state: { options: CommonActionOptions };
  set_bypass: { options: CommonActionOptions & { value: boolean } };
  set_path_number: {
    options: CommonActionOptions & { path: string; value: number };
  };
  set_path_text: {
    options: CommonActionOptions & { path: string; value: string };
  };
  set_source: { options: CommonActionOptions & { source: string } };
  set_output: { options: CommonActionOptions & { output: string } };
  adjust_path_delta: {
    options: CommonActionOptions & {
      path: string;
      delta: number;
      clamp: boolean;
    };
  };
  reset_path: { options: CommonActionOptions & { path: string } };
  reset_paths: { options: CommonActionOptions & { paths: string[] } };
  reset_rgb: { options: CommonActionOptions };
  reset_grade_wheel: { options: CommonActionOptions & { wheel: string } };
  reset_all: { options: CommonActionOptions };
  teranex_set_number: {
    options: CommonActionOptions & { path: string; value: number };
  };
  teranex_adjust: {
    options: CommonActionOptions & { path: string; delta: number };
  };
  teranex_reset: { options: CommonActionOptions & { path: string } };
  teranex_reset_group: { options: CommonActionOptions & { group: string } };
  teranex_test_pattern: { options: CommonActionOptions & { pattern: string } };
  teranex_test_tone: { options: CommonActionOptions & { tone: string } };
  teranex_no_signal: { options: CommonActionOptions & { value: string } };
  teranex_motion: { options: CommonActionOptions & { mode: string } };
  teranex_preset_recall: { options: CommonActionOptions & { preset: string } };
  teranex_preset_save: { options: CommonActionOptions & { preset: string } };
  teranex_preset_rename: {
    options: CommonActionOptions & { preset: string; name: string };
  };
};

const numericPathChoices = NUMERIC_PATHS.map((path) => ({
  id: path,
  label: path,
}));

const boxOption = {
  id: "box",
  type: "textinput",
  label: "Box id (optional)",
  default: "",
} as const;

function boxDropdownChoices(
  self: ModuleInstance,
): { id: string; label: string }[] {
  return self
    .getBoxes()
    .map((b) => ({ id: b.id, label: `${b.name || b.id} (${b.id})` }));
}

function outputDropdownChoices(
  self: ModuleInstance,
): { id: string; label: string }[] {
  return self
    .getKnownOutputs()
    .map((output) => ({ id: output, label: output }));
}

function normalizeBox(optionBox: string): string | undefined {
  const trimmed = (optionBox || "").trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

const teranexNumberChoices = TERANEX_NUMBERS.map((n) => ({
  id: n.path,
  label: `${n.label} (${n.path}, ${n.min}..${n.max})`,
}));

const teranexPresetChoices = Array.from(
  { length: TERANEX_PRESET_COUNT },
  (_, i) => ({ id: String(i + 1), label: `Preset ${i + 1}` }),
);

function choicesOf(
  map: Record<string, string>,
): { id: string; label: string }[] {
  return Object.entries(map).map(([id, label]) => ({ id, label }));
}

/**
 * Resolves the box a Teranex action targets, or undefined (and a log line)
 * when it would land on a LUT box. Teranex paths mean nothing to a ColorBox or
 * BoxIO - the app would answer "Unknown control path" - so say what is wrong
 * instead. An explicit box id is trusted, as the app validates it anyway.
 */
function teranexTarget(
  self: ModuleInstance,
  optionBox: string,
): { box: string | undefined } | undefined {
  const box = normalizeBox(optionBox);
  const driver = box
    ? self.getBoxes().find((b) => b.id === box)?.driver
    : self.getSelectedDriver();
  if (driver && driver !== TERANEX_DRIVER) {
    self.log(
      "warn",
      `Teranex action ignored: ${box ? `box '${box}'` : "the selected box"} uses the ${driver} driver, not a Teranex.`,
    );
    return undefined;
  }
  return { box };
}

export function UpdateActions(self: ModuleInstance): void {
  self.setActionDefinitions({
    refresh_boxes: {
      name: "Refresh boxes",
      options: [],
      callback: async () => {
        self.sendListBoxes();
      },
    },
    select_box: {
      name: "Select box",
      options: [
        {
          id: "box",
          type: "dropdown",
          label: "Box",
          default: self.getSelectedBoxId() || "",
          choices: boxDropdownChoices(self),
          allowCustom: true,
        },
      ],
      callback: async (event) => {
        const box = normalizeBox(event.options.box);
        if (box) self.selectBox(box);
      },
    },
    request_state: {
      name: "Request current state",
      options: [
        {
          id: "box",
          type: "textinput",
          label: "Box id (optional)",
          default: "",
        },
      ],
      callback: async (event) => {
        self.requestState(normalizeBox(event.options.box));
      },
    },
    set_bypass: {
      name: "Set bypass",
      options: [
        {
          id: "box",
          type: "textinput",
          label: "Box id (optional)",
          default: "",
        },
        {
          id: "value",
          type: "checkbox",
          label: "Bypass enabled",
          default: true,
        },
      ],
      callback: async (event) => {
        self.setBypass(event.options.value, normalizeBox(event.options.box));
      },
    },
    set_path_number: {
      name: "Set numeric control path",
      options: [
        {
          id: "box",
          type: "textinput",
          label: "Box id (optional)",
          default: "",
        },
        {
          id: "path",
          type: "dropdown",
          label: "Path",
          default: "temp",
          choices: numericPathChoices,
          allowCustom: true,
        },
        {
          id: "value",
          type: "number",
          label: "Value",
          default: 3200,
          min: -100000,
          max: 100000,
          step: 0.01,
        },
      ],
      callback: async (event) => {
        const path = String(event.options.path);
        const value = Number(event.options.value);
        const next = clampPathValue(path, value);
        self.setPath(path, next, normalizeBox(event.options.box));
      },
    },
    set_path_text: {
      name: "Set text/enum control path",
      options: [
        {
          id: "box",
          type: "textinput",
          label: "Box id (optional)",
          default: "",
        },
        {
          id: "path",
          type: "dropdown",
          label: "Path",
          default: "output",
          choices: [
            { id: "source", label: "source" },
            { id: "output", label: "output" },
          ],
          allowCustom: true,
        },
        {
          id: "value",
          type: "textinput",
          label: "Value",
          default: "",
        },
      ],
      callback: async (event) => {
        self.setPath(
          String(event.options.path),
          String(event.options.value),
          normalizeBox(event.options.box),
        );
      },
    },
    set_source: {
      name: "Set source",
      options: [
        {
          id: "box",
          type: "textinput",
          label: "Box id (optional)",
          default: "",
        },
        {
          id: "source",
          type: "dropdown",
          label: "Source",
          default: "rec709",
          choices: SOURCES.map((s) => ({ id: s, label: s })),
        },
      ],
      callback: async (event) => {
        self.setPath(
          "source",
          String(event.options.source),
          normalizeBox(event.options.box),
        );
      },
    },
    set_output: {
      name: "Set output",
      options: [
        {
          id: "box",
          type: "textinput",
          label: "Box id (optional)",
          default: "",
        },
        {
          id: "output",
          type: "dropdown",
          label: "Output",
          default: self.getKnownOutputs()[0] || "",
          choices: outputDropdownChoices(self),
          allowCustom: true,
        },
      ],
      callback: async (event) => {
        self.setPath(
          "output",
          String(event.options.output),
          normalizeBox(event.options.box),
        );
      },
    },
    adjust_path_delta: {
      name: "Adjust path by delta (ideal for knobs)",
      description:
        "Use positive/negative delta actions for Stream Deck+ rotary encoders.",
      options: [
        {
          id: "box",
          type: "textinput",
          label: "Box id (optional)",
          default: "",
        },
        {
          id: "path",
          type: "dropdown",
          label: "Path",
          default: "temp",
          choices: numericPathChoices,
          allowCustom: true,
        },
        {
          id: "delta",
          type: "number",
          label: "Delta per trigger (CW positive, CCW negative)",
          default: 10,
          min: -1000,
          max: 1000,
          step: 0.01,
        },
        {
          id: "clamp",
          type: "checkbox",
          label: "Clamp to known range",
          default: true,
        },
      ],
      callback: async (event) => {
        const path = String(event.options.path);
        const delta = Number(event.options.delta) || pathStep(path);
        const current = self.getControlNumber(path);
        if (current === undefined) {
          // Either state has not arrived yet, or the server build does not
          // know this path at all - in which case the knob stays dead until
          // the app is updated, so say so rather than failing silently.
          self.log(
            "warn",
            `No known value for '${path}' yet - requesting state. Does the app report this path?`,
          );
          self.requestState(normalizeBox(event.options.box));
          return;
        }

        const rawNext = current + delta;
        const next = event.options.clamp
          ? clampPathValue(path, rawNext)
          : rawNext;
        self.setPath(path, next, normalizeBox(event.options.box));
      },
    },
    reset_path: {
      name: "Reset control path to default",
      description:
        "Same as double-clicking the control in the app. Source and output have no default and cannot be reset.",
      options: [
        boxOption,
        {
          id: "path",
          type: "dropdown",
          label: "Path",
          default: "temp",
          choices: numericPathChoices,
          allowCustom: true,
        },
      ],
      callback: async (event) => {
        self.resetPath(
          String(event.options.path),
          normalizeBox(event.options.box),
        );
      },
    },
    reset_paths: {
      name: "Reset several control paths",
      options: [
        boxOption,
        {
          id: "paths",
          type: "multidropdown",
          label: "Paths",
          default: [],
          choices: numericPathChoices,
        },
      ],
      callback: async (event) => {
        const paths = (event.options.paths || [])
          .map((path) => String(path))
          .filter((path) => path.length > 0);
        if (paths.length === 0) return;
        self.resetPaths(paths, normalizeBox(event.options.box));
      },
    },
    reset_rgb: {
      name: "Reset RGB bias (R, G and B)",
      options: [boxOption],
      callback: async (event) => {
        self.resetPaths(RGB_PATHS, normalizeBox(event.options.box));
      },
    },
    reset_grade_wheel: {
      name: "Reset grade wheel",
      description: "Resets r, g, b and master of one wheel.",
      options: [
        boxOption,
        {
          id: "wheel",
          type: "dropdown",
          label: "Wheel",
          default: GRADE_WHEELS[0],
          choices: GRADE_WHEELS.map((wheel) => ({ id: wheel, label: wheel })),
        },
      ],
      callback: async (event) => {
        const wheel = String(event.options.wheel);
        const paths = GRADE_COMPONENTS.map(
          (component) => `grade/${wheel}/${component}`,
        );
        self.resetPaths(paths, normalizeBox(event.options.box));
      },
    },
    reset_all: {
      name: "Reset whole grade",
      description: "Resets every resettable control back to neutral.",
      options: [boxOption],
      callback: async (event) => {
        self.resetPaths(undefined, normalizeBox(event.options.box));
      },
    },

    // --- Blackmagic Teranex ------------------------------------------------
    // Values are the Teranex's own units and go straight to the device.
    teranex_set_number: {
      name: "Teranex: set value",
      options: [
        boxOption,
        {
          id: "path",
          type: "dropdown",
          label: "Control",
          default: "procamp/gain",
          choices: teranexNumberChoices,
        },
        {
          id: "value",
          type: "number",
          label: "Value (device units, clamped to the control's range)",
          default: 0,
          min: -1019,
          max: 1019,
          step: 1,
        },
      ],
      callback: async (event) => {
        const target = teranexTarget(self, event.options.box);
        if (!target) return;
        const path = String(event.options.path);
        self.setPath(
          path,
          clampPathValue(path, Number(event.options.value)),
          target.box,
        );
      },
    },
    teranex_adjust: {
      name: "Teranex: adjust value by delta (ideal for knobs)",
      options: [
        boxOption,
        {
          id: "path",
          type: "dropdown",
          label: "Control",
          default: "procamp/gain",
          choices: teranexNumberChoices,
        },
        {
          id: "delta",
          type: "number",
          label: "Delta per trigger (CW positive, CCW negative)",
          default: 1,
          min: -1000,
          max: 1000,
          step: 1,
        },
      ],
      callback: async (event) => {
        const target = teranexTarget(self, event.options.box);
        if (!target) return;
        const path = String(event.options.path);
        // Variables mirror the SELECTED box only, so an explicit other box has no known value to add to.
        const current =
          target.box && target.box !== self.getSelectedBoxId()
            ? undefined
            : self.getControlNumber(path);
        if (current === undefined) {
          self.log(
            "warn",
            `No known value for '${path}' yet - requesting state.`,
          );
          self.requestState(target.box);
          return;
        }
        const delta = Number(event.options.delta) || pathStep(path);
        self.setPath(path, clampPathValue(path, current + delta), target.box);
      },
    },
    teranex_reset: {
      name: "Teranex: reset value to default",
      options: [
        boxOption,
        {
          id: "path",
          type: "dropdown",
          label: "Control",
          default: "procamp/gain",
          choices: teranexNumberChoices,
        },
      ],
      callback: async (event) => {
        const target = teranexTarget(self, event.options.box);
        if (!target) return;
        const path = String(event.options.path);
        if (!teranexNumber(path)) return;
        self.resetPath(path, target.box);
      },
    },
    teranex_reset_group: {
      name: "Teranex: reset group",
      description:
        "Back to factory values. 'Everything' also turns the test pattern and tone off.",
      options: [
        boxOption,
        {
          id: "group",
          type: "dropdown",
          label: "Group",
          default: "procamp",
          choices: [
            ...Object.entries(TERANEX_RESET_GROUPS).map(([id, g]) => ({
              id,
              label: g.label,
            })),
            { id: "all", label: "Everything" },
          ],
        },
      ],
      callback: async (event) => {
        const target = teranexTarget(self, event.options.box);
        if (!target) return;
        const group = String(event.options.group);
        // Omitting paths makes the app reset every resettable Teranex control.
        self.resetPaths(
          group === "all" ? undefined : TERANEX_RESET_GROUPS[group]?.paths,
          target.box,
        );
      },
    },
    teranex_test_pattern: {
      name: "Teranex: test pattern",
      options: [
        boxOption,
        {
          id: "pattern",
          type: "dropdown",
          label: "Pattern",
          default: "SMPTEBars",
          choices: choicesOf(TERANEX_PATTERNS),
        },
      ],
      callback: async (event) => {
        const target = teranexTarget(self, event.options.box);
        if (!target) return;
        self.setPath(
          "testpattern/pattern",
          String(event.options.pattern),
          target.box,
        );
      },
    },
    teranex_test_tone: {
      name: "Teranex: test tone",
      description: "Only audible while a test pattern is on.",
      options: [
        boxOption,
        {
          id: "tone",
          type: "dropdown",
          label: "Tone",
          default: "Tone1500Hz",
          choices: choicesOf(TERANEX_TONES),
        },
      ],
      callback: async (event) => {
        const target = teranexTarget(self, event.options.box);
        if (!target) return;
        self.setPath(
          "testpattern/tone",
          String(event.options.tone),
          target.box,
        );
      },
    },
    teranex_no_signal: {
      name: "Teranex: output on signal loss",
      options: [
        boxOption,
        {
          id: "value",
          type: "dropdown",
          label: "Output",
          default: "Black",
          choices: choicesOf(TERANEX_NO_SIGNAL),
        },
      ],
      callback: async (event) => {
        const target = teranexTarget(self, event.options.box);
        if (!target) return;
        self.setPath(
          "testpattern/nosignal",
          String(event.options.value),
          target.box,
        );
      },
    },
    teranex_motion: {
      name: "Teranex: test pattern motion",
      options: [
        boxOption,
        {
          id: "mode",
          type: "dropdown",
          label: "Motion",
          default: "toggle",
          choices: [
            { id: "on", label: "On" },
            { id: "off", label: "Off" },
            { id: "toggle", label: "Toggle" },
          ],
        },
      ],
      callback: async (event) => {
        const target = teranexTarget(self, event.options.box);
        if (!target) return;
        const mode = String(event.options.mode);
        const on =
          mode === "toggle"
            ? self.getControlNumber("testpattern/motion") !== 1
            : mode === "on";
        self.setPath("testpattern/motion", on ? 1 : 0, target.box);
      },
    },
    teranex_preset_recall: {
      name: "Teranex: recall preset",
      options: [
        boxOption,
        {
          id: "preset",
          type: "dropdown",
          label: "Preset",
          default: "1",
          choices: teranexPresetChoices,
        },
      ],
      callback: async (event) => {
        const target = teranexTarget(self, event.options.box);
        if (!target) return;
        self.setPath("preset/recall", Number(event.options.preset), target.box);
      },
    },
    teranex_preset_save: {
      name: "Teranex: save current setup to preset",
      description: "Overwrites the preset on the Teranex.",
      options: [
        boxOption,
        {
          id: "preset",
          type: "dropdown",
          label: "Preset",
          default: "1",
          choices: teranexPresetChoices,
        },
      ],
      callback: async (event) => {
        const target = teranexTarget(self, event.options.box);
        if (!target) return;
        self.setPath("preset/save", Number(event.options.preset), target.box);
      },
    },
    teranex_preset_rename: {
      name: "Teranex: rename preset",
      options: [
        boxOption,
        {
          id: "preset",
          type: "dropdown",
          label: "Preset",
          default: "1",
          choices: teranexPresetChoices,
        },
        {
          id: "name",
          type: "textinput",
          label: "Name (max 32 characters)",
          default: "",
        },
      ],
      callback: async (event) => {
        const target = teranexTarget(self, event.options.box);
        if (!target) return;
        const name = String(event.options.name || "").trim();
        if (!name) return;
        self.setPath(
          teranexPresetNamePath(Number(event.options.preset)),
          name,
          target.box,
        );
      },
    },
  });
}
