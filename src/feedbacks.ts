import { combineRgb } from "@companion-module/base";
import type ModuleInstance from "./main.js";
import {
  TERANEX_NUMBERS,
  TERANEX_PATTERNS,
  TERANEX_TONES,
  teranexNumber,
} from "./api.js";

export type FeedbacksSchema = {
  connected: {
    type: "boolean";
    options: Record<string, never>;
  };
  bypass: {
    type: "boolean";
    options: {
      value: boolean;
    };
  };
  selected_box: {
    type: "boolean";
    options: {
      box: string;
    };
  };
  teranex_selected: {
    type: "boolean";
    options: Record<string, never>;
  };
  teranex_test_pattern: {
    type: "boolean";
    options: { pattern: string };
  };
  teranex_test_tone: {
    type: "boolean";
    options: { tone: string };
  };
  teranex_motion: {
    type: "boolean";
    options: Record<string, never>;
  };
  teranex_not_default: {
    type: "boolean";
    options: { path: string };
  };
};

export function UpdateFeedbacks(self: ModuleInstance): void {
  self.setFeedbackDefinitions({
    connected: {
      type: "boolean",
      name: "Connection state",
      defaultStyle: {
        bgcolor: combineRgb(0, 120, 0),
        color: combineRgb(255, 255, 255),
      },
      options: [],
      callback: () => self.isConnected(),
    },
    bypass: {
      type: "boolean",
      name: "Bypass equals",
      defaultStyle: {
        bgcolor: combineRgb(180, 30, 30),
        color: combineRgb(255, 255, 255),
      },
      options: [
        {
          id: "value",
          type: "checkbox",
          label: "Bypass enabled",
          default: true,
        },
      ],
      callback: (feedback) => {
        return self.getBypass() === feedback.options.value;
      },
    },
    selected_box: {
      type: "boolean",
      name: "Selected box id equals",
      defaultStyle: {
        bgcolor: combineRgb(20, 70, 190),
        color: combineRgb(255, 255, 255),
      },
      options: [
        {
          id: "box",
          type: "textinput",
          label: "Box id",
          default: "",
        },
      ],
      callback: (feedback) => {
        return self.getSelectedBoxId() === (feedback.options.box || "").trim();
      },
    },
    // Teranex feedbacks read the selected box's LIVE device values, so they
    // also follow changes made on the Teranex's front panel.
    teranex_selected: {
      type: "boolean",
      name: "Teranex: selected box is a Teranex",
      defaultStyle: {
        bgcolor: combineRgb(60, 60, 60),
        color: combineRgb(255, 255, 255),
      },
      options: [],
      callback: () => self.isTeranexSelected(),
    },
    teranex_test_pattern: {
      type: "boolean",
      name: "Teranex: test pattern equals",
      defaultStyle: {
        bgcolor: combineRgb(200, 120, 0),
        color: combineRgb(0, 0, 0),
      },
      options: [
        {
          id: "pattern",
          type: "dropdown",
          label: "Pattern",
          default: "SMPTEBars",
          choices: Object.entries(TERANEX_PATTERNS).map(([id, label]) => ({
            id,
            label,
          })),
        },
      ],
      callback: (feedback) =>
        self.isTeranexSelected() &&
        self.getControl("testpattern/pattern") === feedback.options.pattern,
    },
    teranex_test_tone: {
      type: "boolean",
      name: "Teranex: test tone equals",
      defaultStyle: {
        bgcolor: combineRgb(200, 120, 0),
        color: combineRgb(0, 0, 0),
      },
      options: [
        {
          id: "tone",
          type: "dropdown",
          label: "Tone",
          default: "Tone1500Hz",
          choices: Object.entries(TERANEX_TONES).map(([id, label]) => ({
            id,
            label,
          })),
        },
      ],
      callback: (feedback) =>
        self.isTeranexSelected() &&
        self.getControl("testpattern/tone") === feedback.options.tone,
    },
    teranex_motion: {
      type: "boolean",
      name: "Teranex: test pattern motion on",
      defaultStyle: {
        bgcolor: combineRgb(0, 110, 160),
        color: combineRgb(255, 255, 255),
      },
      options: [],
      callback: () =>
        self.isTeranexSelected() &&
        self.getControlNumber("testpattern/motion") === 1,
    },
    teranex_not_default: {
      type: "boolean",
      name: "Teranex: value differs from default",
      description:
        "Lights a knob or button while its control is away from the factory value.",
      defaultStyle: {
        bgcolor: combineRgb(160, 100, 0),
        color: combineRgb(255, 255, 255),
      },
      options: [
        {
          id: "path",
          type: "dropdown",
          label: "Control",
          default: "procamp/gain",
          choices: TERANEX_NUMBERS.map((n) => ({
            id: n.path,
            label: `${n.label} (${n.path})`,
          })),
        },
      ],
      callback: (feedback) => {
        if (!self.isTeranexSelected()) return false;
        const path = String(feedback.options.path);
        const value = self.getControlNumber(path);
        const control = teranexNumber(path);
        return (
          value !== undefined &&
          control !== undefined &&
          value !== control.default
        );
      },
    },
  });
}
