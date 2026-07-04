import { useState, useEffect } from 'react'
import { useI18n } from '../lib/i18n'
import type { FileEntry } from '../lib/types'
import { GoBridge } from '../lib/types'

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
  const { t } = useI18n()
  const [path, setPath] = useState('/sdcard')
  const [files, setFiles] = useState<FileEntry[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadFiles(path)
  }, [path])

  const loadFiles = async (dirPath: string) => {
    setLoading(true)
    try {
      const result = await GoBridge.ListFiles(deviceId, dirPath)
      setFiles(result || [])
    } catch (err) {
      console.error(t('loadFilesFailed'), err)
    } finally {
      setLoading(false)
    }
  }

  const navigateTo = (name: string, isDir: boolean) => {
    if (isDir) {
      setPath(`${path === '/' ? '' : path}/${name}`)
    }
  }

  const goUp = () => {
    const parts = path.split('/')
    parts.pop()
    setPath(parts.join('/') || '/')
  }

  return (
    <div className="flex h-full flex-col bg-[#202020] text-white">
      <div className="flex min-h-[56px] items-center gap-2 border-b border-[#151515] bg-[#2f2f2f] px-4">
        <button onClick={goUp} className="grid h-9 w-9 place-items-center rounded-[4px] bg-[#454545] text-lg font-bold hover:bg-[#555]">
          ↑
        </button>
        <div className="flex min-w-0 flex-1 items-center overflow-hidden rounded-[4px] border border-[#4a4a4a] bg-[#252525]">
          <span className="grid h-9 w-10 place-items-center text-[#12baf7]">↔</span>
          <span className="truncate pr-3 text-sm font-medium text-[#d2d2d2]">{path}</span>
        </div>
        <button onClick={() => loadFiles(path)} className="h-9 rounded-[4px] bg-[#454545] px-4 text-sm font-semibold hover:bg-[#555]">
          {t('refresh')}
        </button>
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="w-[178px] flex-none border-r border-[#151515] bg-[#242424] p-3">
          <div className="mb-3 px-2 text-xs font-semibold text-[#858585]">{t('sharedFolder')}</div>
          <div className="space-y-1">
            {SHORTCUTS.map((s) => (
              <button
                key={s.path}
                onClick={() => setPath(s.path)}
                className={`flex h-10 w-full items-center gap-3 rounded-[4px] px-3 text-left text-sm font-semibold ${
                  path === s.path ? 'bg-[#123d4d] text-[#12baf7]' : 'text-[#dcdcdc] hover:bg-white/8'
                }`}
              >
                <span className="grid w-5 place-items-center">{s.path === '/' ? '▣' : '▤'}</span>
                <span className="truncate">{s.label}</span>
              </button>
            ))}
          </div>
        </aside>
        <main className="min-w-0 flex-1 overflow-auto">
        {loading ? (
          <div className="p-10 text-center text-[#9d9d9d]">{t('loading')}</div>
        ) : files.length === 0 ? (
          <div className="grid h-full min-h-[360px] place-items-center text-center text-[#9d9d9d]">
            <div>
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-[4px] bg-[#333] text-3xl text-[#12baf7]">▤</div>
              <div className="font-semibold">{t('emptyDirectory')}</div>
            </div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#2b2b2b]">
              <tr className="border-b border-[#3b3b3b] text-left text-[#a0a0a0]">
                <th className="h-10 px-4 font-semibold">{t('name')}</th>
                <th className="h-10 w-32 px-4 font-semibold">{t('size')}</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr
                  key={file.name}
                  onClick={() => navigateTo(file.name, file.isDir)}
                  className={`border-b border-[#333] text-[#e3e3e3] hover:bg-[#343434] ${
                    file.isDir ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <td className="h-12 px-4">
                    <span className="mr-3 text-[#12baf7]">{file.isDir ? '▤' : '▧'}</span>
                    {file.name}
                  </td>
                  <td className="h-12 px-4 text-[#a9a9a9]">
                    {file.isDir ? '-' : formatSize(file.size)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        </main>
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
