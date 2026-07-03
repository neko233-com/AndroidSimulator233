export interface VMInfo {
  name: string
  cpus: number
  ram: string
  android: string
  status?: string
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

declare global {
  interface Window {
    GoBridge: {
      ListVMs(): Promise<VMInfo[]>
      CreateVM(name: string, android: string): Promise<VMInfo>
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
    }
  }
}

export const GoBridge = window.GoBridge
