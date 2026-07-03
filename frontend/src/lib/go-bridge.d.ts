import type { VMInfo, LogEntry, FileEntry } from './types'

interface GoBridge {
  ListVMs(): Promise<VMInfo[]>
  CreateVM(name: string, android: string): Promise<VMInfo>
  DeleteVM(name: string): Promise<void>
  ListFiles(deviceId: string, path: string): Promise<FileEntry[]>
  UploadFile(deviceId: string, localPath: string, remotePath: string): Promise<void>
  DownloadFile(deviceId: string, remotePath: string, localPath: string): Promise<void>
  GetLogs(deviceId: string, filter: string): Promise<LogEntry[]>
  StreamLogs(deviceId: string, filter: string): Promise<void>
  Execute(deviceId: string, command: string): Promise<string>
}

declare global {
  interface Window {
    ListVMs: GoBridge['ListVMs']
    CreateVM: GoBridge['CreateVM']
    DeleteVM: GoBridge['DeleteVM']
    ListFiles: GoBridge['ListFiles']
    UploadFile: GoBridge['UploadFile']
    DownloadFile: GoBridge['DownloadFile']
    GetLogs: GoBridge['GetLogs']
    StreamLogs: GoBridge['StreamLogs']
    Execute: GoBridge['Execute']
  }
}

export {}
