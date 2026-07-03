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

function requireMethod<K extends keyof GoBridgeAPI>(name: K): GoBridgeAPI[K] {
  const bridge = window.GoBridge as GoBridgeAPI | undefined
  const method = bridge?.[name] ?? window[name]
  if (!method) {
    throw new Error(`Native bridge method ${String(name)} is unavailable`)
  }
  return method as GoBridgeAPI[K]
}

export const GoBridge: GoBridgeAPI = {
  ListVMs: (...args) => requireMethod('ListVMs')(...args),
  CreateVM: (...args) => requireMethod('CreateVM')(...args),
  CreateVMWithConfig: (...args) => requireMethod('CreateVMWithConfig')(...args),
  DeleteVM: (...args) => requireMethod('DeleteVM')(...args),
  StartVM: (...args) => requireMethod('StartVM')(...args),
  StopVM: (...args) => requireMethod('StopVM')(...args),
  ResetVM: (...args) => requireMethod('ResetVM')(...args),
  ScreenshotVM: (...args) => requireMethod('ScreenshotVM')(...args),
  ListFiles: (...args) => requireMethod('ListFiles')(...args),
  UploadFile: (...args) => requireMethod('UploadFile')(...args),
  DownloadFile: (...args) => requireMethod('DownloadFile')(...args),
  GetLogs: (...args) => requireMethod('GetLogs')(...args),
  StreamLogs: (...args) => requireMethod('StreamLogs')(...args),
  Execute: (...args) => requireMethod('Execute')(...args),
  GetDefaultApps: (...args) => requireMethod('GetDefaultApps')(...args),
  DownloadImage: (...args) => requireMethod('DownloadImage')(...args),
  GetAvailableImages: (...args) => requireMethod('GetAvailableImages')(...args),
  EnsureImageReady: (...args) => requireMethod('EnsureImageReady')(...args),
  GetAppLogPath: (...args) => requireMethod('GetAppLogPath')(...args),
  GetAppLogs: (...args) => requireMethod('GetAppLogs')(...args),
}
