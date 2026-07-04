import type { FileEntry, GoBridgeAPI, LogEntry, VMInfo } from './types'

interface LegacyGoBridge {
  ListVMs(): Promise<VMInfo[]>
  CreateVM(name: string, android: string): Promise<VMInfo>
  CreateVMWithConfig(name: string, android: string, cpus: number, ram: string, resolution: string, dpi: number, performance: string, renderer: string, maxFps: number, root: boolean, phoneBrand: string, phoneModel: string): Promise<VMInfo>
  UpdateVMConfig(name: string, android: string, cpus: number, ram: string, resolution: string, dpi: number, performance: string, renderer: string, maxFps: number, root: boolean, phoneBrand: string, phoneModel: string): Promise<VMInfo>
  DeleteVM(name: string): Promise<void>
  ListFiles(deviceId: string, path: string): Promise<FileEntry[]>
  UploadFile(deviceId: string, localPath: string, remotePath: string): Promise<void>
  DownloadFile(deviceId: string, remotePath: string, localPath: string): Promise<void>
  GetLogs(deviceId: string, filter: string): Promise<LogEntry[]>
  StreamLogs(deviceId: string, filter: string): Promise<void>
  Execute(deviceId: string, command: string): Promise<string>
  GetAppLogPath(): Promise<string>
  GetAppLogs(maxBytes: number): Promise<string>
}

declare global {
  interface Window {
    GoBridge?: GoBridgeAPI
    ListVMs?: LegacyGoBridge['ListVMs']
    CreateVM?: LegacyGoBridge['CreateVM']
    CreateVMWithConfig?: LegacyGoBridge['CreateVMWithConfig']
    UpdateVMConfig?: LegacyGoBridge['UpdateVMConfig']
    DeleteVM?: LegacyGoBridge['DeleteVM']
    ListFiles?: LegacyGoBridge['ListFiles']
    UploadFile?: LegacyGoBridge['UploadFile']
    DownloadFile?: LegacyGoBridge['DownloadFile']
    GetLogs?: LegacyGoBridge['GetLogs']
    StreamLogs?: LegacyGoBridge['StreamLogs']
    Execute?: LegacyGoBridge['Execute']
    GetAppLogPath?: LegacyGoBridge['GetAppLogPath']
    GetAppLogs?: LegacyGoBridge['GetAppLogs']
  }
}

export {}
