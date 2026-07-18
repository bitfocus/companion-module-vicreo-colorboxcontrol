import { combineRgb, type CompanionPresetDefinitions, type CompanionPresetSection } from '@companion-module/base'
import type { ModuleSchema } from './main.js'
import type ModuleInstance from './main.js'
import { GRADE_COMPONENTS, GRADE_WHEELS, SOURCES } from './api.js'

export function UpdatePresets(self: ModuleInstance): void {
  const presets: CompanionPresetDefinitions<ModuleSchema> = {}

  presets.connection = {
    type: 'simple',
    name: 'Connection',
    style: {
      text: 'ColorBox\\nConn',
      size: '14',
      color: combineRgb(255, 255, 255),
      bgcolor: combineRgb(50, 50, 50),
      show_topbar: false,
    },
    steps: [{ down: [], up: [] }],
    feedbacks: [
      {
        feedbackId: 'connected',
        options: {},
        style: {
          bgcolor: combineRgb(0, 120, 0),
        },
      },
    ],
  }

  presets.bypass_on = {
    type: 'simple',
    name: 'Bypass On',
    style: {
      text: 'Bypass ON',
      size: '14',
      color: combineRgb(255, 255, 255),
      bgcolor: combineRgb(130, 20, 20),
      show_topbar: false,
    },
    steps: [
      {
        down: [
          {
            actionId: 'set_bypass',
            options: {
              box: '',
              value: true,
            },
          },
        ],
        up: [],
      },
    ],
    feedbacks: [],
  }

  presets.bypass_off = {
    type: 'simple',
    name: 'Bypass Off',
    style: {
      text: 'Bypass OFF',
      size: '14',
      color: combineRgb(255, 255, 255),
      bgcolor: combineRgb(20, 80, 20),
      show_topbar: false,
    },
    steps: [
      {
        down: [
          {
            actionId: 'set_bypass',
            options: {
              box: '',
              value: false,
            },
          },
        ],
        up: [],
      },
    ],
    feedbacks: [],
  }

  presets.temp_knob = {
    type: 'simple',
    name: 'Temp Knob (+/-10)',
    style: {
      text: 'Temp\\nKnob',
      size: '14',
      color: combineRgb(255, 255, 255),
      bgcolor: combineRgb(130, 95, 20),
      show_topbar: false,
    },
    steps: [
      {
        down: [],
        up: [],
        rotate_left: [
          {
            actionId: 'adjust_path_delta',
            options: {
              box: '',
              path: 'temp',
              delta: -10,
              clamp: true,
            },
          },
        ],
        rotate_right: [
          {
            actionId: 'adjust_path_delta',
            options: {
              box: '',
              path: 'temp',
              delta: 10,
              clamp: true,
            },
          },
        ],
      },
    ],
    feedbacks: [],
  }

  for (const channel of ['r', 'g', 'b']) {
    presets[`rgb_${channel}_knob`] = {
      type: 'simple',
      name: `RGB ${channel.toUpperCase()} Knob (+/-0.01)`,
      style: {
        text: `${channel.toUpperCase()}\\nKnob`,
        size: '14',
        color: combineRgb(255, 255, 255),
        bgcolor: combineRgb(75, 75, 75),
        show_topbar: false,
      },
      steps: [
        {
          down: [],
          up: [],
          rotate_left: [
            {
              actionId: 'adjust_path_delta',
              options: {
                box: '',
                path: `rgb/${channel}`,
                delta: -0.01,
                clamp: true,
              },
            },
          ],
          rotate_right: [
            {
              actionId: 'adjust_path_delta',
              options: {
                box: '',
                path: `rgb/${channel}`,
                delta: 0.01,
                clamp: true,
              },
            },
          ],
        },
      ],
      feedbacks: [],
    }
  }

  for (const wheel of GRADE_WHEELS) {
    for (const component of GRADE_COMPONENTS) {
      const id = `grade_${wheel}_${component}_knob`
      const label = component.toUpperCase()
      presets[id] = {
        type: 'simple',
        name: `${wheel} ${label} Knob (+/-0.01)`,
        style: {
          text: `${wheel}\\n${label}`,
          size: '14',
          color: combineRgb(255, 255, 255),
          bgcolor: combineRgb(80, 55, 20),
          show_topbar: false,
        },
        steps: [
          {
            down: [],
            up: [],
            rotate_left: [
              {
                actionId: 'adjust_path_delta',
                options: {
                  box: '',
                  path: `grade/${wheel}/${component}`,
                  delta: -0.01,
                  clamp: true,
                },
              },
            ],
            rotate_right: [
              {
                actionId: 'adjust_path_delta',
                options: {
                  box: '',
                  path: `grade/${wheel}/${component}`,
                  delta: 0.01,
                  clamp: true,
                },
              },
            ],
          },
        ],
        feedbacks: [],
      }
    }
  }

  for (const source of SOURCES) {
    presets[`source_${source}`] = {
      type: 'simple',
      name: `Set source ${source}`,
      style: {
        text: `Source\\n${source}`,
        size: '14',
        color: combineRgb(255, 255, 255),
        bgcolor: combineRgb(45, 85, 135),
        show_topbar: false,
      },
      steps: [
        {
          down: [
            {
              actionId: 'set_source',
              options: {
                box: '',
                source,
              },
            },
          ],
          up: [],
        },
      ],
      feedbacks: [],
    }
  }

  for (const output of self.getKnownOutputs()) {
    const safeOutputId = output.replaceAll(/[^a-zA-Z0-9_-]/g, '_')
    presets[`output_${safeOutputId}`] = {
      type: 'simple',
      name: `Set output ${output}`,
      style: {
        text: `Output\\n${output}`,
        size: '14',
        color: combineRgb(255, 255, 255),
        bgcolor: combineRgb(100, 55, 120),
        show_topbar: false,
      },
      steps: [
        {
          down: [
            {
              actionId: 'set_output',
              options: {
                box: '',
                output,
              },
            },
          ],
          up: [],
        },
      ],
      feedbacks: [],
    }
  }

  for (const box of self.getBoxes()) {
    const safeBoxId = box.id.replaceAll(/[^a-zA-Z0-9_-]/g, '_')
    presets[`select_box_${safeBoxId}`] = {
      type: 'simple',
      name: `Select box ${box.name || box.id}`,
      style: {
        text: `Box\\n${box.name || box.id}`,
        size: '14',
        color: combineRgb(255, 255, 255),
        bgcolor: combineRgb(20, 70, 190),
        show_topbar: false,
      },
      steps: [
        {
          down: [
            {
              actionId: 'select_box',
              options: {
                box: box.id,
              },
            },
          ],
          up: [],
        },
      ],
      feedbacks: [
        {
          feedbackId: 'selected_box',
          options: {
            box: box.id,
          },
          style: {
            bgcolor: combineRgb(15, 120, 60),
          },
        },
      ],
    }
  }

  const structure: CompanionPresetSection<ModuleSchema>[] = [
    {
      id: 'status',
      name: 'Status',
      definitions: ['connection'],
    },
    {
      id: 'bypass',
      name: 'Bypass',
      definitions: ['bypass_on', 'bypass_off'],
    },
    {
      id: 'knobs',
      name: 'Knob Presets',
      definitions: Object.keys(presets).filter((id) => id.endsWith('_knob')),
    },
    {
      id: 'source',
      name: 'Source Presets',
      definitions: Object.keys(presets).filter((id) => id.startsWith('source_')),
    },
    {
      id: 'output',
      name: 'Output Presets',
      definitions: Object.keys(presets).filter((id) => id.startsWith('output_')),
    },
    {
      id: 'boxes',
      name: 'Box Select Presets',
      definitions: Object.keys(presets).filter((id) => id.startsWith('select_box_')),
    },
  ]

  self.setPresetDefinitions(structure, presets)
}
