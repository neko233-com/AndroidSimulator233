import { useState } from 'react'
import { useI18n } from '../lib/i18n'
import type { VMInfo } from '../lib/types'
import { GoBridge, formatNativeError } from '../lib/types'

interface VMCardProps {
  vm: VMInfo
  onStart: (name: string) => void
  onOpen: (name: string) => void
  onSettings: (vm: VMInfo) => void
  onRefresh: () => void
  isStarting?: boolean
  viewMode?: 'detail' | 'list'
  batchMode?: boolean
  selected?: boolean
  onToggleSelected?: (name: string) => void
}

export function VMCard({
  vm,
  onStart,
  onOpen,
  onSettings,
  onRefresh,
  isStarting = false,
  viewMode = 'detail',
  batchMode = false,
  selected = false,
  onToggleSelected,
}: VMCardProps) {
  const { t } = useI18n()
  const [menuOpen, setMenuOpen] = useState(false)
  const [action, setAction] = useState<'cleanup' | 'rename' | 'copy' | 'backup' | 'shortcut' | null>(null)
  const [draftName, setDraftName] = useState(vm.name)
  const [actionBusy, setActionBusy] = useState(false)
  const [actionMessage, setActionMessage] = useState('')
  const [backups, setBackups] = useState<string[]>([])

  const statusLabels: Record<string, string> = {
    running: t('running'),
    stopped: t('stopped'),
    starting: t('starting'),
    error: t('error'),
  }

  const status = isStarting ? 'starting' : vm.status || 'stopped'
  const isRunning = !isStarting && vm.status === 'running'
  const androidLabel = vm.android?.replace('android-', 'Android ') || 'Android'
  const resolution = vm.resolution?.replace('x', ' x ') ?? '1280 x 720'
  const cardLayout = viewMode === 'list'
    ? 'min-h-[82px] gap-4 px-4 py-2'
    : 'min-h-[142px] gap-6 px-4 py-3'
  const previewSize = viewMode === 'list' ? 'h-[58px] w-[104px]' : 'h-[108px] w-[190px]'

  const openAction = (nextAction: typeof action) => {
    setMenuOpen(false)
    setActionMessage('')
    if (nextAction === 'rename') setDraftName(vm.name)
    if (nextAction === 'copy') setDraftName(`${vm.name}-copy`)
    setAction(nextAction)
  }

  const cloneDevice = async (targetName: string) => {
    try {
      return await GoBridge.CloneVM(vm.name, targetName)
    } catch {
      return GoBridge.CreateVMWithConfig(
        targetName,
        vm.android || 'android-12',
        vm.cpus || 6,
        vm.ram || '12G',
        vm.resolution || '1280x720',
        vm.dpi || 240,
        vm.performance || 'high',
        'vulkan',
        vm.maxFps || 120,
        Boolean(vm.root),
        vm.phoneBrand || 'Xiaomi',
        vm.phoneModel || '14 Ultra'
      )
    }
  }

  const submitRename = async () => {
    const nextName = draftName.trim()
    if (!nextName || nextName === vm.name) {
      setAction(null)
      return
    }
    setActionBusy(true)
    try {
      try {
        await GoBridge.RenameVM(vm.name, nextName)
      } catch {
        await cloneDevice(nextName)
        await GoBridge.DeleteVM(vm.name)
      }
      onRefresh()
      setAction(null)
    } catch (error) {
      setActionMessage(t('actionFailed') + formatNativeError(error))
    } finally {
      setActionBusy(false)
    }
  }

  const submitCopy = async () => {
    const nextName = draftName.trim()
    if (!nextName) return
    setActionBusy(true)
    try {
      await cloneDevice(nextName)
      onRefresh()
      setAction(null)
    } catch (error) {
      setActionMessage(t('actionFailed') + formatNativeError(error))
    } finally {
      setActionBusy(false)
    }
  }

  const createBackup = () => {
    const stamp = new Date().toISOString().replace('T', ' ').slice(0, 19)
    setBackups((items) => [`${vm.name} ${stamp}`, ...items])
    setActionMessage(t('backupCreated'))
  }

  return (
    <div className={`group relative flex items-center border-b border-[#383838] bg-[#2f2f2f] transition-colors hover:bg-[#343434] ${selected ? 'bg-[#253641] ring-1 ring-inset ring-[#12baf7]' : ''} ${cardLayout}`}>
      {batchMode && (
        <label className="grid h-8 w-8 flex-none place-items-center">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelected?.(vm.name)}
            className="h-4 w-4 accent-[#1d8fff]"
            aria-label={`${t('selectDevice')} ${vm.name}`}
          />
        </label>
      )}
      <button
        type="button"
        onClick={() => onOpen(vm.name)}
        className={`relative flex-none overflow-hidden rounded-[3px] border border-black/35 bg-[#111] text-left shadow-inner ${previewSize}`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_28%,rgba(44,157,218,0.34),transparent_24%),radial-gradient(circle_at_30%_72%,rgba(88,61,177,0.34),transparent_28%),linear-gradient(135deg,#313a42_0%,#1d2530_46%,#0b0d12_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-9 bg-black/45" />
        <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-black/28 px-2 py-0.5 text-[11px] font-semibold text-white/90">
          <span className={`h-2.5 w-2.5 rounded-full ${status === 'running' ? 'bg-[#34d399]' : status === 'starting' ? 'bg-[#60a5fa]' : 'bg-white/50'}`} />
          #{vm.adbPort ?? '0'}
        </div>
        <div className="absolute inset-x-0 bottom-0 flex h-9 items-center justify-center gap-1.5 px-2 text-[18px] font-bold text-white">
          {status === 'stopped' && <span className="text-[22px] leading-none">⏻</span>}
          <span>{statusLabels[status]}</span>
        </div>
        {isStarting && (
          <div className="absolute inset-0 grid place-items-center bg-black/25 backdrop-blur-sm">
            <div className="h-16 w-16 animate-spin rounded-full border-[3px] border-white/80 border-t-transparent" />
          </div>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onOpen(vm.name)}
          className={`block max-w-full truncate text-left font-semibold leading-tight text-white hover:text-[#12baf7] ${viewMode === 'list' ? 'text-[15px]' : 'text-[17px]'}`}
        >
          {vm.name}
        </button>
        <div className={`${viewMode === 'list' ? 'mt-2' : 'mt-3'} flex flex-wrap items-center gap-2 text-[13px] font-medium text-[#d7d7d7]`}>
          <span className="rounded-[2px] bg-[#4b4b4b] px-2.5 py-1">{androidLabel}</span>
          <span className="rounded-[2px] bg-[#4b4b4b] px-2.5 py-1">
            {vm.cpus} {t('cores')}
          </span>
          <span className="rounded-[2px] bg-[#4b4b4b] px-2.5 py-1">{vm.ram}</span>
          <span className="rounded-[2px] bg-[#123d4d] px-2.5 py-1 text-[#8be3ff]">Vulkan</span>
          <span className="rounded-[2px] bg-[#4b4b4b] px-2.5 py-1">{vm.maxFps ?? 120} FPS</span>
        </div>
        <div className="mt-3 text-[13px] font-medium text-[#bcbcbc]">
          {resolution} | {vm.dpi ?? 240} DPI
        </div>
      </div>

      <div className="relative ml-auto flex flex-none items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (isStarting) return
              if (isRunning) {
                onOpen(vm.name)
                return
              }
              onStart(vm.name)
            }}
            className="grid h-11 w-11 place-items-center rounded-full bg-[#4a4a4a] text-xl text-white transition-colors hover:bg-[#12baf7] hover:text-[#10212b] disabled:cursor-wait disabled:opacity-70"
            title={isRunning ? t('open') : t('start')}
            disabled={isStarting}
          >
            {isStarting ? <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/80 border-t-transparent" /> : '▶'}
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="grid h-11 w-11 place-items-center rounded-full bg-[#4a4a4a] text-2xl leading-none text-white transition-colors hover:bg-[#555]"
            title={t('settings')}
          >
            ⋮
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-12 z-20 w-[178px] overflow-hidden rounded-[4px] border border-[#4b4b4b] bg-[#3a3a3a] py-1 text-white shadow-2xl">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  onSettings(vm)
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold hover:bg-white/10"
              >
                <span>▣</span>
                <span>{t('deviceSettings')}</span>
              </button>
              {[
                [t('diskCleanup'), 'cleanup'],
                [t('rename'), 'rename'],
                [t('copy'), 'copy'],
                [t('backupRestore'), 'backup'],
                [t('desktopShortcut'), 'shortcut'],
              ].map(([item, itemAction], index) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => openAction(itemAction as typeof action)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold hover:bg-white/10"
                >
                  <span>{['▤', '✎', '▣', '↺', '↗'][index]}</span>
                  <span>{item}</span>
                </button>
              ))}
            </div>
          )}
      </div>
      {action && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45">
          <div className="w-[420px] max-w-[calc(100vw-32px)] overflow-hidden rounded-[4px] border border-[#454545] bg-[#303030] text-white shadow-2xl">
            <div className="flex h-11 items-center border-b border-[#242424] px-5">
              <div className="text-[15px] font-semibold">
                {action === 'rename' && t('renameDeviceTitle')}
                {action === 'copy' && t('copyDeviceTitle')}
                {action === 'cleanup' && t('diskCleanupTitle')}
                {action === 'backup' && t('backupRestoreTitle')}
                {action === 'shortcut' && t('shortcutTitle')}
              </div>
              <button onClick={() => setAction(null)} className="ml-auto grid h-8 w-8 place-items-center rounded-[3px] text-xl text-white/70 hover:bg-white/10">×</button>
            </div>
            <div className="space-y-4 p-5">
              {(action === 'rename' || action === 'copy') && (
                <label className="block">
                  <span className="mb-2 block text-[13px] font-semibold text-[#bcbcbc]">
                    {action === 'rename' ? t('newDeviceName') : t('copyDeviceName')}
                  </span>
                  <input
                    value={draftName}
                    onChange={(event) => setDraftName(event.target.value)}
                    className="h-10 w-full rounded-[4px] border border-[#4a4a4a] bg-[#191919] px-3 text-sm text-white outline-none focus:border-[#12baf7]"
                    autoFocus
                  />
                </label>
              )}

              {action === 'cleanup' && (
                <div className="rounded-[4px] border border-[#3a3a3a] bg-[#191919] p-4 text-sm leading-6 text-[#d6d6d6]">
                  {t('cleanupDescription')}
                </div>
              )}

              {action === 'backup' && (
                <div className="space-y-3">
                  <div className="rounded-[4px] border border-[#3a3a3a] bg-[#191919] p-4 text-sm leading-6 text-[#d6d6d6]">
                    {t('backupDescription')}
                  </div>
                  <div className="rounded-[4px] border border-[#3a3a3a] bg-[#191919]">
                    {backups.length === 0 ? (
                      <div className="px-3 py-4 text-sm text-[#777]">{t('noBackupYet')}</div>
                    ) : backups.map((backup) => (
                      <div key={backup} className="flex h-10 items-center border-b border-[#2c2c2c] px-3 last:border-b-0">
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{backup}</span>
                        <button onClick={() => setActionMessage(t('restoreBackup'))} className="rounded-[3px] bg-[#3d3d3d] px-3 py-1 text-xs font-semibold hover:bg-[#555]">{t('restoreBackup')}</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {action === 'shortcut' && (
                <div className="rounded-[4px] border border-[#3a3a3a] bg-[#191919] p-4 text-sm leading-6 text-[#d6d6d6]">
                  {t('shortcutDescription')}
                </div>
              )}

              {actionMessage && (
                <div className={`rounded-[4px] px-3 py-2 text-sm font-semibold ${actionMessage.startsWith(t('actionFailed')) ? 'bg-red-500/16 text-[#ffb0b0]' : 'bg-[#123d4d] text-[#8be3ff]'}`}>
                  {actionMessage}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 border-t border-[#242424] px-5 py-4">
              <button onClick={() => setAction(null)} className="h-9 min-w-[86px] rounded-[4px] border border-[#555] bg-[#3d3d3d] px-4 text-sm font-semibold hover:bg-[#4a4a4a]">{t('cancel')}</button>
              {action === 'rename' && <button onClick={submitRename} disabled={actionBusy} className="h-9 min-w-[104px] rounded-[4px] bg-[#12baf7] px-4 text-sm font-bold text-[#10212b] hover:bg-[#19c7ff] disabled:opacity-55">{t('confirm')}</button>}
              {action === 'copy' && <button onClick={submitCopy} disabled={actionBusy} className="h-9 min-w-[104px] rounded-[4px] bg-[#12baf7] px-4 text-sm font-bold text-[#10212b] hover:bg-[#19c7ff] disabled:opacity-55">{t('confirm')}</button>}
              {action === 'cleanup' && <button onClick={() => setActionMessage(t('cleanupComplete'))} className="h-9 min-w-[104px] rounded-[4px] bg-[#12baf7] px-4 text-sm font-bold text-[#10212b] hover:bg-[#19c7ff]">{t('cleanupNow')}</button>}
              {action === 'backup' && <button onClick={createBackup} className="h-9 min-w-[104px] rounded-[4px] bg-[#12baf7] px-4 text-sm font-bold text-[#10212b] hover:bg-[#19c7ff]">{t('createBackup')}</button>}
              {action === 'shortcut' && <button onClick={() => setActionMessage(t('shortcutCreated'))} className="h-9 min-w-[104px] rounded-[4px] bg-[#12baf7] px-4 text-sm font-bold text-[#10212b] hover:bg-[#19c7ff]">{t('createShortcut')}</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
