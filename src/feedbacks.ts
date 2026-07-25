import { combineRgb } from "@companion-module/base";
import type ModuleInstance from "./main.js";

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
  });
}
