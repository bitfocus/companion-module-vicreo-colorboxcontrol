import type ModuleInstance from './main.js'
import { COMMON_PATHS, SOURCES, clampPathValue, pathStep } from './api.js'

type CommonActionOptions = {
  box: string
}

export type ActionsSchema = {
  refresh_boxes: { options: Record<string, never> }
  select_box: { options: { box: string } }
  request_state: { options: CommonActionOptions }
  set_bypass: { options: CommonActionOptions & { value: boolean } }
  set_path_number: { options: CommonActionOptions & { path: string; value: number } }
  set_path_text: { options: CommonActionOptions & { path: string; value: string } }
  set_source: { options: CommonActionOptions & { source: string } }
  set_output: { options: CommonActionOptions & { output: string } }
  adjust_path_delta: { options: CommonActionOptions & { path: string; delta: number; clamp: boolean } }
}

function boxDropdownChoices(self: ModuleInstance): { id: string; label: string }[] {
  return self.getBoxes().map((b) => ({ id: b.id, label: `${b.name || b.id} (${b.id})` }))
}

function outputDropdownChoices(self: ModuleInstance): { id: string; label: string }[] {
  return self.getKnownOutputs().map((output) => ({ id: output, label: output }))
}

function normalizeBox(optionBox: string): string | undefined {
  const trimmed = (optionBox || '').trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export function UpdateActions(self: ModuleInstance): void {
  self.setActionDefinitions({
    refresh_boxes: {
      name: 'Refresh boxes',
      options: [],
      callback: async () => {
        self.sendListBoxes()
      },
    },
    select_box: {
      name: 'Select box',
      options: [
        {
          id: 'box',
          type: 'dropdown',
          label: 'Box',
          default: self.getSelectedBoxId() || '',
          choices: boxDropdownChoices(self),
          allowCustom: true,
        },
      ],
      callback: async (event) => {
        const box = normalizeBox(event.options.box)
        if (box) self.selectBox(box)
      },
    },
    request_state: {
      name: 'Request current state',
      options: [
        {
          id: 'box',
          type: 'textinput',
          label: 'Box id (optional)',
          default: '',
        },
      ],
      callback: async (event) => {
        self.requestState(normalizeBox(event.options.box))
      },
    },
    set_bypass: {
      name: 'Set bypass',
      options: [
        {
          id: 'box',
          type: 'textinput',
          label: 'Box id (optional)',
          default: '',
        },
        {
          id: 'value',
          type: 'checkbox',
          label: 'Bypass enabled',
          default: true,
        },
      ],
      callback: async (event) => {
        self.setBypass(event.options.value, normalizeBox(event.options.box))
      },
    },
    set_path_number: {
      name: 'Set numeric control path',
      options: [
        {
          id: 'box',
          type: 'textinput',
          label: 'Box id (optional)',
          default: '',
        },
        {
          id: 'path',
          type: 'dropdown',
          label: 'Path',
          default: 'temp',
          choices: COMMON_PATHS.filter((p) => p !== 'source' && p !== 'output').map((p) => ({ id: p, label: p })),
          allowCustom: true,
        },
        {
          id: 'value',
          type: 'number',
          label: 'Value',
          default: 3200,
          min: -100000,
          max: 100000,
          step: 0.01,
        },
      ],
      callback: async (event) => {
        const path = String(event.options.path)
        const value = Number(event.options.value)
        const next = clampPathValue(path, value)
        self.setPath(path, next, normalizeBox(event.options.box))
      },
    },
    set_path_text: {
      name: 'Set text/enum control path',
      options: [
        {
          id: 'box',
          type: 'textinput',
          label: 'Box id (optional)',
          default: '',
        },
        {
          id: 'path',
          type: 'dropdown',
          label: 'Path',
          default: 'output',
          choices: [
            { id: 'source', label: 'source' },
            { id: 'output', label: 'output' },
          ],
          allowCustom: true,
        },
        {
          id: 'value',
          type: 'textinput',
          label: 'Value',
          default: '',
        },
      ],
      callback: async (event) => {
        self.setPath(String(event.options.path), String(event.options.value), normalizeBox(event.options.box))
      },
    },
    set_source: {
      name: 'Set source',
      options: [
        {
          id: 'box',
          type: 'textinput',
          label: 'Box id (optional)',
          default: '',
        },
        {
          id: 'source',
          type: 'dropdown',
          label: 'Source',
          default: 'rec709',
          choices: SOURCES.map((s) => ({ id: s, label: s })),
        },
      ],
      callback: async (event) => {
        self.setPath('source', String(event.options.source), normalizeBox(event.options.box))
      },
    },
    set_output: {
      name: 'Set output',
      options: [
        {
          id: 'box',
          type: 'textinput',
          label: 'Box id (optional)',
          default: '',
        },
        {
          id: 'output',
          type: 'dropdown',
          label: 'Output',
          default: self.getKnownOutputs()[0] || '',
          choices: outputDropdownChoices(self),
          allowCustom: true,
        },
      ],
      callback: async (event) => {
        self.setPath('output', String(event.options.output), normalizeBox(event.options.box))
      },
    },
    adjust_path_delta: {
      name: 'Adjust path by delta (ideal for knobs)',
      description: 'Use positive/negative delta actions for Stream Deck+ rotary encoders.',
      options: [
        {
          id: 'box',
          type: 'textinput',
          label: 'Box id (optional)',
          default: '',
        },
        {
          id: 'path',
          type: 'dropdown',
          label: 'Path',
          default: 'temp',
          choices: COMMON_PATHS.filter((p) => p !== 'source' && p !== 'output').map((p) => ({ id: p, label: p })),
          allowCustom: true,
        },
        {
          id: 'delta',
          type: 'number',
          label: 'Delta per trigger (CW positive, CCW negative)',
          default: 10,
          min: -1000,
          max: 1000,
          step: 0.01,
        },
        {
          id: 'clamp',
          type: 'checkbox',
          label: 'Clamp to known range',
          default: true,
        },
      ],
      callback: async (event) => {
        const path = String(event.options.path)
        const delta = Number(event.options.delta) || pathStep(path)
        const current = self.getControlNumber(path)
        if (current === undefined) {
          self.requestState(normalizeBox(event.options.box))
          return
        }

        const rawNext = current + delta
        const next = event.options.clamp ? clampPathValue(path, rawNext) : rawNext
        self.setPath(path, next, normalizeBox(event.options.box))
      },
    },
  })
}
