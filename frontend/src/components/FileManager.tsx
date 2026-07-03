import { useState, useEffect } from 'react'
import type { FileEntry } from '../lib/types'

interface FileManagerProps {
  deviceId: string
}

const SHORTCUTS = [
  { label: 'sdcard', path: '/sdcard' },
  { label: 'Downloads', path: '/sdcard/Download' },
  { label: 'DCIM', path: '/sdcard/DCIM' },
  { label: 'Pictures', path: '/sdcard/Pictures' },
  { label: 'Music', path: '/sdcard/Music' },
  { label: 'Movies', path: '/sdcard/Movies' },
  { label: 'Documents', path: '/sdcard/Documents' },
  { label: 'Root', path: '/' },
]

export function FileManager({ deviceId }: FileManagerProps) {
  const [path, setPath] = useState('/sdcard')
  const [files, setFiles] = useState<FileEntry[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadFiles(path)
  }, [path])

  const loadFiles = async (dirPath: string) => {
    setLoading(true)
    try {
      const result = await window.ListFiles(deviceId, dirPath)
      setFiles(result || [])
    } catch (err) {
      console.error('Failed to load files:', err)
    } finally {
      setLoading(false)
    }
  }

  const navigateTo = (name: string, isDir: boolean) => {
    if (isDir) {
      setPath(`${path}/${name}`)
    }
  }

  const goUp = () => {
    const parts = path.split('/')
    parts.pop()
    setPath(parts.join('/') || '/')
  }

  return (
    <div className="flex flex-col h-full bg-gray-800">
      <div className="flex items-center gap-2 p-2 bg-gray-700 border-b border-gray-600">
        <button
          onClick={goUp}
          className="px-2 py-1 text-sm bg-gray-600 rounded hover:bg-gray-500"
        >
          ..
        </button>
        {SHORTCUTS.map((s) => (
          <button
            key={s.path}
            onClick={() => setPath(s.path)}
            className={`px-2 py-1 text-sm rounded ${
              path === s.path
                ? 'bg-blue-600 text-white'
                : 'bg-gray-600 hover:bg-gray-500'
            }`}
          >
            {s.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400">{path}</span>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-400">Loading...</div>
        ) : files.length === 0 ? (
          <div className="p-4 text-center text-gray-400">Empty directory</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-700">
                <th className="p-2">Name</th>
                <th className="p-2 w-24">Size</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr
                  key={file.name}
                  onClick={() => navigateTo(file.name, file.isDir)}
                  className={`hover:bg-gray-700 ${
                    file.isDir ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <td className="p-2">
                    {file.isDir ? '📁' : '📄'} {file.name}
                  </td>
                  <td className="p-2 text-gray-400">
                    {file.isDir ? '-' : formatSize(file.size)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024)
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
}
