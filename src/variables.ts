import type ModuleInstance from "./main.js";
import { COMMON_PATHS, pathVariableId } from "./api.js";

export type VariablesSchema = Record<string, string | number>;

export function UpdateVariableDefinitions(self: ModuleInstance): void {
  const defs: Record<string, { name: string }> = {
    connection: { name: "Connection state" },
    selected_box_id: { name: "Selected box id" },
    selected_box_name: { name: "Selected box name" },
    bypass: { name: "Bypass state" },
  };

  for (const path of COMMON_PATHS) {
    defs[pathVariableId(path)] = { name: `Control ${path}` };
  }

  self.setVariableDefinitions(defs);
}
