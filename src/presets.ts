import { combineRgb, type CompanionPresetDefinitions, type CompanionPresetSection } from '@companion-module/base'
import type { ModuleSchema } from './main.js'
import type ModuleInstance from './main.js'
import { GRADE_COMPONENTS, GRADE_WHEELS, SOURCES, pathVariable } from './api.js'

const RGB_LABELS: Record<string, string> = { r: 'Red', g: 'Green', b: 'Blue' }

// The standalone (non wheel, non channel) numeric controls, in doc order.
const SCALAR_KNOBS = [
  { path: 'temp', label: 'Temp', delta: 10, bgcolor: combineRgb(130, 95, 20) },
  { path: 'tint', label: 'Tint', delta: 0.01, bgcolor: combineRgb(95, 60, 120) },
  { path: 'saturation', label: 'Sat', delta: 0.01, bgcolor: combineRgb(25, 105, 110) },
]

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

  for (const knob of SCALAR_KNOBS) {
    presets[`${knob.path}_knob`] = {
      type: 'simple',
      name: `${knob.label} Knob (+/-${knob.delta}, press to reset)`,
      style: {
        text: `${knob.label}\\n${pathVariable(knob.path)}`,
        size: '14',
        color: combineRgb(255, 255, 255),
        bgcolor: knob.bgcolor,
        show_topbar: false,
      },
      steps: [
        {
          down: [
            {
              actionId: 'reset_path',
              options: {
                box: '',
                path: knob.path,
              },
            },
          ],
          up: [],
          rotate_left: [
            {
              actionId: 'adjust_path_delta',
              options: {
                box: '',
                path: knob.path,
                delta: -knob.delta,
                clamp: true,
              },
            },
          ],
          rotate_right: [
            {
              actionId: 'adjust_path_delta',
              options: {
                box: '',
                path: knob.path,
                delta: knob.delta,
                clamp: true,
              },
            },
          ],
        },
      ],
      feedbacks: [],
    }
  }

  for (const channel of ['r', 'g', 'b']) {
    presets[`rgb_${channel}_knob`] = {
      type: 'simple',
      name: `RGB ${channel.toUpperCase()} Knob (+/-0.01, press to reset)`,
      style: {
        text: `${RGB_LABELS[channel]}\\n${pathVariable(`rgb/${channel}`)}`,
        size: '14',
        color: combineRgb(255, 255, 255),
        bgcolor: combineRgb(75, 75, 75),
        show_topbar: false,
      },
      steps: [
        {
          down: [
            {
              actionId: 'reset_path',
              options: {
                box: '',
                path: `rgb/${channel}`,
              },
            },
          ],
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
      const path = `grade/${wheel}/${component}`
      presets[id] = {
        type: 'simple',
        name: `${wheel} ${label} Knob (+/-0.01, press to reset)`,
        style: {
          text: `${wheel}\\n${label}\\n${pathVariable(path)}`,
          size: '14',
          color: combineRgb(255, 255, 255),
          bgcolor: combineRgb(80, 55, 20),
          show_topbar: false,
        },
        steps: [
          {
            down: [
              {
                actionId: 'reset_path',
                options: {
                  box: '',
                  path,
                },
              },
            ],
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

  presets.reset_all = {
    type: 'simple',
    name: 'Reset whole grade',
    style: {
      text: 'Reset\\nGrade',
      size: '14',
      color: combineRgb(255, 255, 255),
      bgcolor: combineRgb(110, 30, 60),
      show_topbar: false,
    },
    steps: [
      {
        down: [
          {
            actionId: 'reset_all',
            options: {
              box: '',
            },
          },
        ],
        up: [],
      },
    ],
    feedbacks: [],
  }

  presets.reset_rgb = {
    type: 'simple',
    name: 'Reset RGB bias',
    style: {
      text: 'Reset\\nRGB',
      size: '14',
      color: combineRgb(255, 255, 255),
      bgcolor: combineRgb(90, 40, 60),
      show_topbar: false,
    },
    steps: [
      {
        down: [
          {
            actionId: 'reset_rgb',
            options: {
              box: '',
            },
          },
        ],
        up: [],
      },
    ],
    feedbacks: [],
  }

  for (const knob of SCALAR_KNOBS) {
    presets[`reset_${knob.path}`] = {
      type: 'simple',
      name: `Reset ${knob.label.toLowerCase()}`,
      style: {
        text: `Reset\\n${knob.label}\\n${pathVariable(knob.path)}`,
        size: '14',
        color: combineRgb(255, 255, 255),
        bgcolor: combineRgb(90, 40, 60),
        show_topbar: false,
      },
      steps: [
        {
          down: [
            {
              actionId: 'reset_path',
              options: {
                box: '',
                path: knob.path,
              },
            },
          ],
          up: [],
        },
      ],
      feedbacks: [],
    }
  }

  for (const channel of ['r', 'g', 'b']) {
    presets[`reset_rgb_${channel}`] = {
      type: 'simple',
      name: `Reset RGB ${channel.toUpperCase()}`,
      style: {
        text: `Reset\\n${RGB_LABELS[channel]}\\n${pathVariable(`rgb/${channel}`)}`,
        size: '14',
        color: combineRgb(255, 255, 255),
        bgcolor: combineRgb(90, 40, 60),
        show_topbar: false,
      },
      steps: [
        {
          down: [
            {
              actionId: 'reset_path',
              options: {
                box: '',
                path: `rgb/${channel}`,
              },
            },
          ],
          up: [],
        },
      ],
      feedbacks: [],
    }
  }

  for (const wheel of GRADE_WHEELS) {
    presets[`reset_grade_${wheel}`] = {
      type: 'simple',
      name: `Reset ${wheel} wheel`,
      style: {
        text: `Reset\\n${wheel}`,
        size: '14',
        color: combineRgb(255, 255, 255),
        bgcolor: combineRgb(90, 40, 60),
        show_topbar: false,
      },
      steps: [
        {
          down: [
            {
              actionId: 'reset_grade_wheel',
              options: {
                box: '',
                wheel,
              },
            },
          ],
          up: [],
        },
      ],
      feedbacks: [],
    }

    for (const component of GRADE_COMPONENTS) {
      const path = `grade/${wheel}/${component}`
      presets[`reset_grade_${wheel}_${component}`] = {
        type: 'simple',
        name: `Reset ${wheel} ${component.toUpperCase()}`,
        style: {
          text: `Reset\\n${wheel} ${component.toUpperCase()}\\n${pathVariable(path)}`,
          size: '14',
          color: combineRgb(255, 255, 255),
          bgcolor: combineRgb(70, 35, 50),
          show_topbar: false,
        },
        steps: [
          {
            down: [
              {
                actionId: 'reset_path',
                options: {
                  box: '',
                  path,
                },
              },
            ],
            up: [],
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
      id: 'reset',
      name: 'Reset Presets',
      definitions: Object.keys(presets).filter((id) => id.startsWith('reset_')),
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
