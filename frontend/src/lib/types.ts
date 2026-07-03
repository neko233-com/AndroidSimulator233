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
