import { InstanceBase, InstanceStatus, type SomeCompanionConfigField } from '@companion-module/base'
import WebSocket from 'ws'
import { GetConfigFields, type ModuleConfig } from './config.js'
import { UpdateVariableDefinitions, type VariablesSchema } from './variables.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions, type ActionsSchema } from './actions.js'
import { UpdateFeedbacks, type FeedbacksSchema } from './feedbacks.js'
import { UpdatePresets } from './presets.js'
import { COMMON_PATHS, clampPathValue, toNumberOrNull } from './api.js'

export type BoxInfo = {
  id: string
  name: string
  driver?: string
  channel?: number
  boxioMode?: string
  model?: string
  controllable?: boolean
}

export type ModuleSchema = {
  config: ModuleConfig
  secrets: undefined
  actions: ActionsSchema
  feedbacks: FeedbacksSchema
  variables: VariablesSchema
}

type StateMessage = {
  op: 'state'
  box: string
  name?: string
  controls?: Record<string, unknown>
  bypass?: boolean
}

export { UpgradeScripts }

export default class ModuleInstance extends InstanceBase<ModuleSchema> {
  config!: ModuleConfig

  private ws: WebSocket | null = null
  private reconnectTimer: NodeJS.Timeout | null = null
  private pollTimer: NodeJS.Timeout | null = null
  private boxes: BoxInfo[] = []
  private knownOutputs = new Set<string>()
  private selectedBoxId = ''
  private selectedBoxName = ''
  private controls = new Map<string, number | string>()
  private bypass = false
  private isReady = false

  async init(config: ModuleConfig, _isFirstInit: boolean, _secrets: undefined): Promise<void> {
    this.config = config

    this.updateActions()
    this.updateFeedbacks()
    this.updatePresets()
    this.updateVariableDefinitions()

    this.connect()
  }

  async destroy(): Promise<void> {
    this.clearTimers()
    this.closeSocket()
  }

  async configUpdated(config: ModuleConfig, _secrets: undefined): Promise<void> {
    this.config = config
    this.connect()
  }

  getConfigFields(): SomeCompanionConfigField[] {
    return GetConfigFields()
  }

  updateActions(): void {
    UpdateActions(this)
  }

  updateFeedbacks(): void {
    UpdateFeedbacks(this)
  }

  updatePresets(): void {
    UpdatePresets(this)
  }

  updateVariableDefinitions(): void {
    UpdateVariableDefinitions(this)
  }

  getBoxes(): BoxInfo[] {
    return this.boxes
  }

  getKnownOutputs(): string[] {
    return Array.from(this.knownOutputs).sort((a, b) => a.localeCompare(b))
  }

  getSelectedBoxId(): string {
    return this.selectedBoxId
  }

  getSelectedBoxName(): string {
    return this.selectedBoxName
  }

  getBypass(): boolean {
    return this.bypass
  }

  isConnected(): boolean {
    return this.isReady
  }

  getControl(path: string): number | string | undefined {
    return this.controls.get(path)
  }

  getControlNumber(path: string): number | undefined {
    const value = this.controls.get(path)
    return typeof value === 'number' ? value : undefined
  }

  sendListBoxes(): void {
    this.sendMessage({ op: 'listBoxes' })
  }

  selectBox(boxId: string): void {
    this.sendMessage({ op: 'select', box: boxId })
  }

  requestState(boxId?: string): void {
    if (boxId) {
      this.sendMessage({ op: 'get', box: boxId })
    } else {
      this.sendMessage({ op: 'get' })
    }
  }

  setPath(path: string, value: number | string, boxId?: string): void {
    if (boxId) {
      this.sendMessage({ op: 'set', box: boxId, path, value })
    } else {
      this.sendMessage({ op: 'set', path, value })
    }
  }

  setBypass(value: boolean, boxId?: string): void {
    if (boxId) {
      this.sendMessage({ op: 'bypass', box: boxId, value })
    } else {
      this.sendMessage({ op: 'bypass', value })
    }
  }

  adjustPath(path: string, delta: number, boxId?: string): void {
    const current = this.getControlNumber(path)
    if (current === undefined) return
    const next = clampPathValue(path, current + delta)
    this.setPath(path, next, boxId)
  }

  private connect(): void {
    this.clearTimers()
    this.closeSocket()

    const host = this.config.host?.trim() || '127.0.0.1'
    const port = Number(this.config.port) || 4455
    const url = `ws://${host}:${port}`

    this.updateStatus(InstanceStatus.Connecting)
    this.ws = new WebSocket(url)

    this.ws.on('open', () => {
      this.sendMessage({ op: 'hello', token: this.config.token?.trim() || undefined })
      this.isReady = true
      this.updateStatus(InstanceStatus.Ok)

      if (this.config.defaultBox?.trim()) {
        this.selectBox(this.config.defaultBox.trim())
      } else {
        this.sendListBoxes()
      }

      this.startPolling()
      this.checkAllFeedbacks()
      this.pushVariables()
    })

    this.ws.on('message', (data: WebSocket.RawData) => {
      const payload = this.parseMessage(data.toString())
      if (!payload) return
      this.handleIncoming(payload)
    })

    this.ws.on('close', () => {
      this.isReady = false
      this.updateStatus(InstanceStatus.Disconnected)
      this.checkAllFeedbacks()
      this.scheduleReconnect()
    })

    this.ws.on('error', (error: Error) => {
      this.log('error', `WebSocket error: ${error.message}`)
      this.isReady = false
      this.updateStatus(InstanceStatus.ConnectionFailure)
      this.checkAllFeedbacks()
      this.scheduleReconnect()
    })
  }

  private closeSocket(): void {
    if (this.ws) {
      this.ws.removeAllListeners()
      this.ws.close()
      this.ws = null
    }
    this.isReady = false
  }

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
  }

  private startPolling(): void {
    if (this.pollTimer) clearInterval(this.pollTimer)
    const pollMs = Number(this.config.pollMs) || 2000
    this.pollTimer = setInterval(() => {
      if (!this.isReady) return
      this.requestState(this.selectedBoxId || undefined)
      this.sendMessage({ op: 'ping' })
    }, Math.max(250, pollMs))
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return
    const reconnectMs = Math.max(250, Number(this.config.reconnectMs) || 2000)
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, reconnectMs)
  }

  private sendMessage(msg: Record<string, unknown>): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
    this.ws.send(JSON.stringify(msg))
  }

  private parseMessage(raw: string): Record<string, unknown> | null {
    try {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, unknown>
      }
      return null
    } catch (error) {
      this.log('warn', `Invalid JSON from server: ${(error as Error).message}`)
      return null
    }
  }

  private handleIncoming(msg: Record<string, unknown>): void {
    const op = msg.op
    if (typeof op !== 'string') return

    switch (op) {
      case 'welcome': {
        const boxes = Array.isArray(msg.boxes) ? msg.boxes : []
        this.boxes = boxes.filter((b): b is BoxInfo => typeof b === 'object' && b !== null && typeof (b as BoxInfo).id === 'string')
        const changed = this.addOutputsFromPaths(msg.paths)
        if (!this.selectedBoxId && this.boxes.length > 0) {
          this.selectedBoxId = this.boxes[0].id
          this.selectedBoxName = this.boxes[0].name || this.boxes[0].id
        }
        this.checkAllFeedbacks()
        this.updateActions()
        if (changed) this.updatePresets()
        this.pushVariables()
        return
      }
      case 'boxes': {
        const boxes = Array.isArray(msg.boxes) ? msg.boxes : []
        this.boxes = boxes.filter((b): b is BoxInfo => typeof b === 'object' && b !== null && typeof (b as BoxInfo).id === 'string')
        this.checkAllFeedbacks()
        this.updateActions()
        this.updatePresets()
        this.pushVariables()
        return
      }
      case 'state': {
        this.applyState(msg as StateMessage)
        return
      }
      case 'error': {
        const message = typeof msg.message === 'string' ? msg.message : 'Unknown API error'
        this.log('error', message)
        if (message.toLowerCase().includes('token') || message.toLowerCase().includes('auth')) {
          this.updateStatus(InstanceStatus.AuthenticationFailure)
        }
        return
      }
      default:
        return
    }
  }

  private applyState(state: StateMessage): void {
    let changedDynamicOutputs = false

    if (typeof state.box === 'string') {
      this.selectedBoxId = state.box
      const box = this.boxes.find((b) => b.id === state.box)
      this.selectedBoxName = state.name || box?.name || state.box
    }

    if (typeof state.bypass === 'boolean') {
      this.bypass = state.bypass
    }

    if (state.controls && typeof state.controls === 'object') {
      for (const [path, rawValue] of Object.entries(state.controls)) {
        const numeric = toNumberOrNull(rawValue)
        if (numeric !== null) {
          this.controls.set(path, numeric)
        } else if (typeof rawValue === 'string') {
          this.controls.set(path, rawValue)
          if (path === 'output' && this.addKnownOutput(rawValue)) {
            changedDynamicOutputs = true
          }
        }
      }
    }

    if (changedDynamicOutputs) {
      this.updateActions()
      this.updatePresets()
    }

    this.checkAllFeedbacks()
    this.pushVariables()
  }

  private addKnownOutput(output: string): boolean {
    const normalized = output.trim()
    if (!normalized) return false
    const before = this.knownOutputs.size
    this.knownOutputs.add(normalized)
    return this.knownOutputs.size !== before
  }

  private addOutputsFromPaths(paths: unknown): boolean {
    let changed = false

    const collect = (node: unknown): void => {
      if (Array.isArray(node)) {
        for (const item of node) collect(item)
        return
      }

      if (!node || typeof node !== 'object') return
      const obj = node as Record<string, unknown>

      if (obj.path === 'output') {
        for (const key of ['values', 'choices', 'enum', 'options']) {
          const value = obj[key]
          if (Array.isArray(value)) {
            for (const maybeOutput of value) {
              if (typeof maybeOutput === 'string' && this.addKnownOutput(maybeOutput)) {
                changed = true
              }
            }
          }
        }
      }

      if (Array.isArray(obj.output)) {
        for (const maybeOutput of obj.output) {
          if (typeof maybeOutput === 'string' && this.addKnownOutput(maybeOutput)) {
            changed = true
          }
        }
      }

      for (const value of Object.values(obj)) {
        collect(value)
      }
    }

    collect(paths)
    return changed
  }

  pushVariables(): void {
    const values: Record<string, string | number> = {
      connection: this.isReady ? 'connected' : 'disconnected',
      selected_box_id: this.selectedBoxId,
      selected_box_name: this.selectedBoxName,
      bypass: this.bypass ? 'on' : 'off',
    }

    for (const path of COMMON_PATHS) {
      const key = `control_${path.replaceAll('/', '_')}`
      const value = this.controls.get(path)
      if (value !== undefined) values[key] = typeof value === 'number' ? Number(value.toFixed(4)) : value
    }

    this.setVariableValues(values)
  }
}
