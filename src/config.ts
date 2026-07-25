import { Regex, type SomeCompanionConfigField } from "@companion-module/base";

export type ModuleConfig = {
  host: string;
  port: number;
  token: string;
  defaultBox: string;
  pollMs: number;
  reconnectMs: number;
};

export function GetConfigFields(): SomeCompanionConfigField[] {
  return [
    {
      type: "textinput",
      id: "host",
      label: "Host",
      width: 6,
      default: "127.0.0.1",
      regex: Regex.HOSTNAME,
    },
    {
      type: "number",
      id: "port",
      label: "Port",
      width: 6,
      min: 1,
      max: 65535,
      default: 4455,
    },
    {
      type: "textinput",
      id: "token",
      label: "Auth token (optional)",
      width: 12,
      default: "",
      regex: "/.*/i",
    },
    {
      type: "textinput",
      id: "defaultBox",
      label: "Default box id (optional)",
      width: 12,
      default: "",
      regex: "/.*/i",
    },
    {
      type: "number",
      id: "pollMs",
      label: "State poll interval (ms)",
      width: 6,
      min: 250,
      max: 30000,
      default: 2000,
    },
    {
      type: "number",
      id: "reconnectMs",
      label: "Reconnect interval (ms)",
      width: 6,
      min: 250,
      max: 30000,
      default: 2000,
    },
  ];
}
