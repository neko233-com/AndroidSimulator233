export interface VMInfo {
  name: string
  cpus: number
  ram: string
  android: string
  resolution?: string
  dpi?: number
  performance?: string
  renderer?: string
  maxFps?: number
  root?: boolean
  phoneBrand?: string
  phoneModel?: string
  status?: string
  adbPort?: number
  vncPort?: number
  backend?: string
  hostIndex?: string
}

export interface VMCreateOptions {
  name: string
  android: string
  cpus: number
  ram: string
  resolution: string
  dpi: number
  performance: string
  renderer: string
  maxFps: number
  root: boolean
  phoneBrand: string
  phoneModel: string
}

export interface FileEntry {
  name: string
  size: number
  isDir: boolean
}

export interface LogEntry {
  level: string
  tag: string
  message: string
  pid: number
}

export interface ImageInfo {
  version: string
  downloaded: boolean
  size: number
}

declare global {
  interface Window {
    GoBridge?: GoBridgeAPI
    ListVMs?: GoBridgeAPI['ListVMs']
    CreateVM?: GoBridgeAPI['CreateVM']
    CreateVMWithConfig?: GoBridgeAPI['CreateVMWithConfig']
    DeleteVM?: GoBridgeAPI['DeleteVM']
    StartVM?: GoBridgeAPI['StartVM']
    StopVM?: GoBridgeAPI['StopVM']
    ResetVM?: GoBridgeAPI['ResetVM']
    ScreenshotVM?: GoBridgeAPI['ScreenshotVM']
    ListFiles?: GoBridgeAPI['ListFiles']
    UploadFile?: GoBridgeAPI['UploadFile']
    DownloadFile?: GoBridgeAPI['DownloadFile']
    GetLogs?: GoBridgeAPI['GetLogs']
    StreamLogs?: GoBridgeAPI['StreamLogs']
    Execute?: GoBridgeAPI['Execute']
    GetDefaultApps?: GoBridgeAPI['GetDefaultApps']
    DownloadImage?: GoBridgeAPI['DownloadImage']
    GetAvailableImages?: GoBridgeAPI['GetAvailableImages']
    EnsureImageReady?: GoBridgeAPI['EnsureImageReady']
  }
}

export interface GoBridgeAPI {
      ListVMs(): Promise<VMInfo[]>
      CreateVM(name: string, android: string): Promise<VMInfo>
      CreateVMWithConfig(name: string, android: string, cpus: number, ram: string, resolution: string, dpi: number, performance: string, renderer: string, maxFps: number, root: boolean, phoneBrand: string, phoneModel: string): Promise<VMInfo>
      DeleteVM(name: string): Promise<void>
      StartVM(name: string): Promise<void>
      StopVM(name: string): Promise<void>
      ResetVM(name: string): Promise<void>
      ScreenshotVM(name: string, path: string): Promise<void>
      ListFiles(deviceID: string, path: string): Promise<FileEntry[]>
      UploadFile(deviceID: string, localPath: string, remotePath: string): Promise<void>
      DownloadFile(deviceID: string, remotePath: string, localPath: string): Promise<void>
      GetLogs(deviceID: string, filter: string): Promise<LogEntry[]>
      StreamLogs(deviceID: string, filter: string): Promise<LogEntry[]>
      Execute(deviceID: string, command: string): Promise<string>
      GetDefaultApps(): Promise<string[]>
      DownloadImage(version: string): Promise<void>
      GetAvailableImages(): Promise<ImageInfo[]>
      EnsureImageReady(version: string): Promise<string>
      GetAppLogPath(): Promise<string>
      GetAppLogs(maxBytes: number): Promise<string>
}

type WailsRuntime = {
  Call: {
    ByID: (id: number, ...args: unknown[]) => Promise<unknown>
  }
}

const wailsMethodIDs: Partial<Record<keyof GoBridgeAPI, number>> = {
  CreateVM: 1888402924,
  CreateVMWithConfig: 4106498978,
  DeleteVM: 1532597571,
  DownloadFile: 764734343,
  DownloadImage: 1200166230,
  EnsureImageReady: 3504284291,
  Execute: 2159374336,
  GetAppLogPath: 2362330903,
  GetAppLogs: 1354887257,
  GetAvailableImages: 574155296,
  GetDefaultApps: 3544643360,
  GetLogs: 1743981476,
  ListFiles: 3557170708,
  ListVMs: 398121865,
  ResetVM: 4167799141,
  ScreenshotVM: 3846775552,
  StartVM: 3049061658,
  StopVM: 2028595348,
  StreamLogs: 642717214,
  UploadFile: 3284072274,
}

let wailsRuntime: Promise<WailsRuntime | null> | null = null

function getLegacyMethod<K extends keyof GoBridgeAPI>(name: K): GoBridgeAPI[K] | undefined {
  const bridge = window.GoBridge as GoBridgeAPI | undefined
  const method = bridge?.[name] ?? window[name]
  return method as GoBridgeAPI[K] | undefined
}

function loadWailsRuntime() {
  const dynamicImport = new Function('specifier', 'return import(specifier)') as (
    specifier: string
  ) => Promise<unknown>

  wailsRuntime ??= dynamicImport('/wails/runtime.js')
    .then((module) => module as WailsRuntime)
    .catch((error) => {
      console.error('Failed to load Wails runtime:', error)
      return null
    })
  return wailsRuntime
}

async function callMethod<K extends keyof GoBridgeAPI>(
  name: K,
  ...args: Parameters<GoBridgeAPI[K]>
): Promise<Awaited<ReturnType<GoBridgeAPI[K]>>> {
  try {
    const legacy = getLegacyMethod(name)
    if (legacy) {
      return await (legacy as (...methodArgs: unknown[]) => Promise<Awaited<ReturnType<GoBridgeAPI[K]>>>)(...args)
    }

    const runtime = await loadWailsRuntime()
    const methodID = wailsMethodIDs[name]
    if (!runtime || !methodID) {
      throw new Error(`Native bridge method ${String(name)} is unavailable`)
    }
    return await runtime.Call.ByID(methodID, ...args) as Awaited<ReturnType<GoBridgeAPI[K]>>
  } catch (err) {
    throw new Error(formatNativeError(err))
  }
}

export function formatNativeError(err: unknown) {
  const raw = err instanceof Error ? err.message : String(err)
  const trimmed = raw.replace(/^Error:\s*/, '').trim()
  try {
    const parsed = JSON.parse(trimmed) as { message?: string }
    if (parsed?.message) return parsed.message
  } catch {
    // Keep the original message when it is already plain text.
  }
  return trimmed
}

export const GoBridge: GoBridgeAPI = {
  ListVMs: (...args) => callMethod('ListVMs', ...args),
  CreateVM: (...args) => callMethod('CreateVM', ...args),
  CreateVMWithConfig: (...args) => callMethod('CreateVMWithConfig', ...args),
  DeleteVM: (...args) => callMethod('DeleteVM', ...args),
  StartVM: (...args) => callMethod('StartVM', ...args),
  StopVM: (...args) => callMethod('StopVM', ...args),
  ResetVM: (...args) => callMethod('ResetVM', ...args),
  ScreenshotVM: (...args) => callMethod('ScreenshotVM', ...args),
  ListFiles: (...args) => callMethod('ListFiles', ...args),
  UploadFile: (...args) => callMethod('UploadFile', ...args),
  DownloadFile: (...args) => callMethod('DownloadFile', ...args),
  GetLogs: (...args) => callMethod('GetLogs', ...args),
  StreamLogs: (...args) => callMethod('StreamLogs', ...args),
  Execute: (...args) => callMethod('Execute', ...args),
  GetDefaultApps: (...args) => callMethod('GetDefaultApps', ...args),
  DownloadImage: (...args) => callMethod('DownloadImage', ...args),
  GetAvailableImages: (...args) => callMethod('GetAvailableImages', ...args),
  EnsureImageReady: (...args) => callMethod('EnsureImageReady', ...args),
  GetAppLogPath: (...args) => callMethod('GetAppLogPath', ...args),
  GetAppLogs: (...args) => callMethod('GetAppLogs', ...args),
}
