import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../lib/i18n'
import type { VMInfo } from '../lib/types'
import { GoBridge, formatNativeError } from '../lib/types'

interface DeviceWindowProps {
  deviceName: string
}

type ToolId =
  | 'navigation'
  | 'keyboard'
  | 'record'
  | 'audio'
  | 'sync'
  | 'location'
  | 'window'
  | 'file'
  | 'screenshot'
  | 'developer'
  | 'settings'
  | 'help'

type WindowPrefs = {
  alwaysOnTop: boolean
  miniMode: boolean
  fullscreen: boolean
  opacity: number
}

export function DeviceWindow({ deviceName }: DeviceWindowProps) {
  const { t } = useI18n()
  const [vms, setVMs] = useState<VMInfo[]>([])
  const [booted, setBooted] = useState(false)
  const [progress, setProgress] = useState(8)
  const [toolOpen, setToolOpen] = useState(false)
  const [activeTool, setActiveTool] = useState<ToolId | null>(null)
  const [activeNav, setActiveNav] = useState<'back' | 'home' | 'recent' | null>(null)
  const [stopping, setStopping] = useState(false)
  const [screenFrame, setScreenFrame] = useState('')
  const [frameError, setFrameError] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const [volume, setVolume] = useState(80)
  const [micEnabled, setMicEnabled] = useState(false)
  const [syncEnabled, setSyncEnabled] = useState(false)
  const [windowPrefs, setWindowPrefs] = useState<WindowPrefs>({
    alwaysOnTop: false,
    miniMode: false,
    fullscreen: false,
    opacity: 100,
  })
  const [toast, setToast] = useState('')
  const [screenshotFlash, setScreenshotFlash] = useState(false)

  const vm = useMemo(() => vms.find((item) => item.name === deviceName), [deviceName, vms])
  const adbDeviceId = vm?.adbPort ? `127.0.0.1:${vm.adbPort}` : ''
  const isRunning = vm?.status === 'running'
  const isStarting = vm?.status === 'starting' || (isRunning && !booted)

  useEffect(() => {
    let cancelled = false
    const refresh = async () => {
      try {
        const result = await GoBridge.ListVMs()
        if (!cancelled) setVMs(result || [])
      } catch (error) {
        console.error('Failed to refresh devices:', error)
      }
    }

    refresh()
    const timer = window.setInterval(refresh, 1000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    if (!adbDeviceId || !isRunning || booted) return

    let cancelled = false
    const checkBoot = async () => {
      try {
        const value = await GoBridge.Execute(adbDeviceId, 'getprop sys.boot_completed')
        if (!cancelled && value.trim() === '1') {
          setBooted(true)
          setProgress(100)
        }
      } catch {
        if (!cancelled) setProgress((current) => Math.min(current + 7, 92))
      }
    }

    checkBoot()
    const timer = window.setInterval(checkBoot, 1800)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [adbDeviceId, booted, isRunning])

  useEffect(() => {
    if (!isStarting || booted) return
    const timer = window.setInterval(() => {
      setProgress((current) => Math.min(current + 3, 95))
    }, 700)
    return () => window.clearInterval(timer)
  }, [booted, isStarting])

  useEffect(() => {
    if (!adbDeviceId || !booted) {
      setScreenFrame('')
      return
    }

    let cancelled = false
    const loadFrame = async () => {
      try {
        const output = await GoBridge.Execute(adbDeviceId, 'screencap -p | base64')
        const encoded = output.replace(/\s/g, '')
        if (!cancelled && encoded.length > 128) {
          setScreenFrame(`data:image/png;base64,${encoded}`)
          setFrameError(false)
        }
      } catch {
        if (!cancelled) setFrameError(true)
      }
    }

    loadFrame()
    const timer = window.setInterval(loadFrame, 1600)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [adbDeviceId, booted])

  useEffect(() => {
    if (!activeNav) return
    const timer = window.setTimeout(() => setActiveNav(null), 900)
    return () => window.clearTimeout(timer)
  }, [activeNav])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 1400)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (!recording) return
    const timer = window.setInterval(() => setRecordSeconds((current) => current + 1), 1000)
    return () => window.clearInterval(timer)
  }, [recording])

  const stopDevice = async () => {
    if (!vm || stopping) return
    setStopping(true)
    try {
      await GoBridge.StopVM(vm.name)
      setBooted(false)
      setProgress(0)
      setScreenFrame('')
    } catch (error) {
      alert(t('stopFailed') + formatNativeError(error))
    } finally {
      setStopping(false)
    }
  }

  const openTool = (tool: ToolId) => {
    setToolOpen(false)
    setActiveTool(tool)
  }

  const takeScreenshot = async (path: string) => {
    setScreenshotFlash(true)
    window.setTimeout(() => setScreenshotFlash(false), 180)
    if (!vm) {
      setToast(t('noDeviceSelected'))
      return
    }
    try {
      await GoBridge.ScreenshotVM(vm.name, path)
      setToast(t('screenshotSaved'))
    } catch (error) {
      setToast(`${t('screenshotFailed')}${formatNativeError(error)}`)
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#08090b] text-white">
      <div className="flex h-[36px] flex-none items-center border-b border-black bg-[#111214] px-2">
        <div className="relative mr-2 h-6 w-6 overflow-hidden rounded-[5px] bg-[#18baff]">
          <span className="absolute left-[5px] top-[8px] h-[10px] w-[5px] rotate-[-26deg] rounded-full bg-white" />
          <span className="absolute left-[10px] top-[7px] h-[11px] w-[5px] rotate-[25deg] rounded-full bg-white" />
          <span className="absolute right-[5px] top-[11px] h-[4px] w-[4px] rounded-full bg-white" />
        </div>
        <div className="min-w-0 truncate text-[13px] font-semibold">{t('appBrand')}</div>
        <div className="ml-3 max-w-[240px] truncate text-[11px] text-white/42">{deviceName}</div>
        <div className="ml-auto flex items-center gap-0.5 text-[16px] text-white/76">
          <button onClick={() => openTool('keyboard')} className="grid h-7 w-7 place-items-center rounded-[3px] hover:bg-white/10" title={t('keyboardGamepad')}>▣</button>
          <button onClick={() => openTool('audio')} className="grid h-7 w-7 place-items-center rounded-[3px] hover:bg-white/10" title={t('audio')}>◔</button>
          <button onClick={() => openTool('window')} className="grid h-7 w-7 place-items-center rounded-[3px] hover:bg-white/10" title={t('windowManagement')}>↻</button>
          <button onClick={() => openTool('screenshot')} className="grid h-7 w-7 place-items-center rounded-[3px] hover:bg-white/10" title={t('screenshot')}>□</button>
          <div className="relative">
            <button
              onClick={() => setToolOpen((open) => !open)}
              className="grid h-7 w-8 place-items-center rounded-[3px] hover:bg-white/10"
              title={t('moreTools')}
            >
              ☰
            </button>
            {toolOpen && <ToolPanel onOpenTool={openTool} onStop={stopDevice} stopping={stopping} />}
          </div>
          <div className="mx-1 h-5 w-px bg-white/10" />
          <button className="grid h-7 w-7 place-items-center rounded-[3px] hover:bg-white/10" title={t('minimize')}>−</button>
          <button className="grid h-7 w-7 place-items-center rounded-[3px] hover:bg-white/10" title={t('close')}>□</button>
          <button className="grid h-7 w-7 place-items-center rounded-[3px] hover:bg-white/10" title={t('close')}>×</button>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden bg-[#0b0d11]">
        {!vm || vm.status === 'stopped' || vm.status === 'error' ? (
          <StoppedState name={deviceName} status={vm?.status} />
        ) : isStarting ? (
          <BootLoading name={deviceName} progress={progress} />
        ) : screenFrame ? (
          <LiveScreen frame={screenFrame} />
        ) : (
          <DeviceHome frameError={frameError} />
        )}
        <div className="absolute bottom-0 left-0 right-0 flex h-11 items-center justify-center gap-12 bg-black/38 text-xl text-white/90 backdrop-blur-sm">
          <button onClick={() => setActiveNav('back')} className={`grid h-8 w-8 place-items-center rounded hover:bg-white/10 ${activeNav === 'back' ? 'bg-white/15' : ''}`} title={t('back')}>‹</button>
          <button onClick={() => setActiveNav('home')} className={`grid h-8 w-8 place-items-center rounded hover:bg-white/10 ${activeNav === 'home' ? 'bg-white/15' : ''}`} title={t('home')}>○</button>
          <button onClick={() => setActiveNav('recent')} className={`grid h-8 w-8 place-items-center rounded hover:bg-white/10 ${activeNav === 'recent' ? 'bg-white/15' : ''}`} title={t('recentTasks')}>□</button>
        </div>
        {activeNav && (
          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-2 text-sm font-medium text-white/90">
            {activeNav === 'back' ? t('back') : activeNav === 'home' ? t('home') : t('recentTasks')}
          </div>
        )}
        {recording && (
          <div className="absolute left-4 top-4 flex h-8 items-center gap-2 rounded-full bg-black/62 px-3 text-sm font-semibold text-white shadow-xl">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#ff4646]" />
            <span>{formatDuration(recordSeconds)}</span>
          </div>
        )}
        {screenshotFlash && <div className="pointer-events-none absolute inset-0 bg-white/32" />}
        {syncEnabled && (
          <div className="absolute right-4 top-4 rounded-[4px] bg-[#123d4d]/90 px-3 py-2 text-xs font-semibold text-[#8be3ff] shadow-xl">
            {t('syncRunning')}
          </div>
        )}
        {toast && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 rounded-full bg-black/68 px-4 py-2 text-sm font-semibold text-white/92 shadow-xl">
            {toast}
          </div>
        )}
      </div>
      {activeTool && (
        <ToolActionModal
          tool={activeTool}
          deviceName={deviceName}
          adbDeviceId={adbDeviceId}
          recording={recording}
          recordSeconds={recordSeconds}
          onRecordingChange={(next) => {
            setRecording(next)
            if (next) setRecordSeconds(0)
            setToast(next ? t('recordingStarted') : t('recordingSaved'))
          }}
          volume={volume}
          onVolumeChange={setVolume}
          micEnabled={micEnabled}
          onMicEnabledChange={setMicEnabled}
          syncEnabled={syncEnabled}
          onSyncEnabledChange={(next) => {
            setSyncEnabled(next)
            setToast(next ? t('syncStarted') : t('syncStopped'))
          }}
          windowPrefs={windowPrefs}
          onWindowPrefsChange={setWindowPrefs}
          onScreenshot={takeScreenshot}
          onToast={setToast}
          onClose={() => setActiveTool(null)}
        />
      )}
    </div>
  )
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0')
  const rest = (seconds % 60).toString().padStart(2, '0')
  return `${minutes}:${rest}`
}

function BootLoading({ name, progress }: { name: string; progress: number }) {
  const { t } = useI18n()
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_38%,rgba(255,225,138,0.9),transparent_10%),radial-gradient(circle_at_26%_78%,rgba(71,164,255,0.5),transparent_26%),linear-gradient(125deg,#08345f_0%,#0b5b98_44%,#06182b_100%)]" />
      <div className="absolute left-[8%] top-[11%] h-[28%] w-[30%] rounded-[8px] bg-white/12 p-5 shadow-2xl backdrop-blur">
        <div className="mb-4 h-7 w-28 rounded bg-white/25" />
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="aspect-square rounded-[8px] bg-white/35 shadow-inner" />
          ))}
        </div>
      </div>
      <div className="absolute right-[10%] top-[18%] grid h-24 w-24 animate-pulse place-items-center rounded-[8px] bg-white/85 text-5xl font-black text-[#2d8fff] shadow-[0_0_80px_rgba(255,255,255,0.6)]">M</div>
      <div className="absolute inset-x-0 bottom-0 bg-black/55 px-6 pb-5 pt-4">
        <div className="mb-2 flex items-center justify-between text-lg">
          <span>{t('bootingDevice').replace('{name}', name)}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
          <div className="h-full bg-sky-400 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  )
}

function StoppedState({ name, status }: { name: string; status?: string }) {
  const { t } = useI18n()
  return (
    <div className="grid h-full place-items-center bg-[#171717]">
      <div className="text-center">
        <div className="mx-auto mb-5 grid h-28 w-28 place-items-center rounded-3xl bg-white/10 text-5xl">⏻</div>
        <div className="text-2xl font-semibold">{name}</div>
        <div className="mt-2 text-gray-400">{status === 'error' ? t('deviceError') : t('devicePoweredOff')}</div>
      </div>
    </div>
  )
}

function LiveScreen({ frame }: { frame: string }) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-black">
      <img src={frame} alt="" className="h-full w-full object-contain" draggable={false} />
    </div>
  )
}

function DeviceHome({ frameError }: { frameError?: boolean }) {
  const { t } = useI18n()
  const systemApps = [
    [t('settings'), '⚙'],
    [t('files'), '▤'],
    [t('gallery'), '▧'],
    [t('developerOptions'), 'ADB'],
  ]
  const folders = [
    { label: 'System Application', x: '18%', y: '56%' },
    { label: 'Tools', x: '43%', y: '56%' },
  ]
  const dockApps = [t('settings'), t('files'), t('gallery'), t('developerOptions')]

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(128deg,#11151f_0%,#090b10_45%,#151922_46%,#08090c_100%)]" />
      <div className="absolute bottom-0 left-0 h-[42%] w-[58%] bg-[linear-gradient(140deg,rgba(255,255,255,0.06),transparent_54%)] [clip-path:polygon(0_100%,42%_0,100%_100%)]" />
      <div className="absolute right-0 top-0 h-[64%] w-[52%] bg-[linear-gradient(215deg,rgba(255,255,255,0.05),transparent_58%)] [clip-path:polygon(100%_0,28%_0,100%_100%)]" />

      <div className="absolute left-4 top-3 text-[15px] font-medium text-white/92">12:34</div>
      <div className="absolute right-5 top-4 flex gap-2 text-[15px] text-white/78">◆ ▰</div>

      <div className="absolute left-1/2 top-[14%] grid w-[46%] -translate-x-1/2 grid-cols-2 gap-x-5 gap-y-3 rounded-[4px] bg-[#303238]/82 p-4 shadow-[0_18px_45px_rgba(0,0,0,0.38)] backdrop-blur">
        {systemApps.map(([name, icon], index) => (
          <div key={name} className="flex min-w-0 items-center gap-3">
            <div className={`grid h-12 w-12 flex-none place-items-center rounded-[8px] text-sm font-black text-white ${index % 2 === 0 ? 'bg-[linear-gradient(135deg,#18baff,#2f5061)]' : 'bg-[linear-gradient(135deg,#4b5664,#1c222c)]'}`}>
              {icon}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[12px] font-medium text-white/88">{name}</div>
              <div className="mt-1 text-[12px] font-bold text-[#8be3ff]">{t('available')}</div>
            </div>
          </div>
        ))}
      </div>

      {folders.map((folder) => (
        <div key={folder.label} className="absolute text-center" style={{ left: folder.x, top: folder.y }}>
          <div className="mx-auto grid h-[54px] w-[54px] grid-cols-2 gap-1 rounded-[7px] bg-[#2c3036]/92 p-2 shadow-xl">
            {['#48c5ff', '#f8ca3a', '#56d675', '#ffffff'].map((color) => (
              <span key={color} className="rounded-[3px]" style={{ backgroundColor: color }} />
            ))}
          </div>
          <div className="mt-2 whitespace-nowrap text-[12px] text-white/82">{folder.label}</div>
        </div>
      ))}

      <div className="absolute bottom-16 left-1/2 flex -translate-x-1/2 gap-8">
        {dockApps.map((app, index) => (
          <div key={app} className="text-center">
            <div className={`mx-auto mb-2 grid h-[52px] w-[52px] place-items-center rounded-[10px] text-sm font-black text-white shadow-lg ${index === 0 ? 'bg-[#19a9ff]' : index === 1 ? 'bg-[#28c772]' : index === 2 ? 'bg-[#4aa3ff]' : 'bg-[#777d89]'}`}>
              {app.slice(0, 2)}
            </div>
            <div className="text-[12px] text-white/82">{app}</div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-[22%] left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-white/70" />
      {frameError && (
        <div className="absolute left-4 bottom-4 rounded bg-black/45 px-3 py-2 text-sm text-white/80">
          {t('screenFramePending')}
        </div>
      )}
    </div>
  )
}

function ToolPanel({
  onOpenTool,
  onStop,
  stopping,
}: {
  onOpenTool: (tool: ToolId) => void
  onStop: () => void
  stopping: boolean
}) {
  const { t } = useI18n()
  const sections = [
    {
      title: t('windowManagement'),
      items: [
        { icon: '⌂', label: t('home'), tool: 'navigation' as const },
        { icon: 'Esc', label: 'Esc', tool: 'navigation' as const },
        { icon: '▣', label: t('alwaysOnTop'), tool: 'window' as const },
        { icon: '◱', label: t('miniMode'), tool: 'window' as const },
        { icon: '↻', label: t('rotateScreen'), tool: 'window' as const },
        { icon: '⛶', label: t('fullscreen'), tool: 'window' as const },
      ],
    },
    {
      title: t('gameAssistance'),
      items: [
        { icon: '⌨', label: t('keyboardGamepad'), tool: 'keyboard' as const },
        { icon: '●', label: t('operationRecord'), tool: 'record' as const },
        { icon: '▣', label: t('multiInstance'), tool: 'window' as const },
        { icon: '⇄', label: t('syncTools'), tool: 'sync' as const },
        { icon: '⌁', label: t('accelerationService'), tool: 'help' as const },
      ],
    },
    {
      title: t('otherFeatures'),
      items: [
        { icon: '✂', label: t('screenshot'), tool: 'screenshot' as const },
        { icon: '▻', label: t('videoRecord'), tool: 'record' as const },
        { icon: 'APK', label: t('apkInstall'), tool: 'file' as const },
        { icon: '↔', label: t('fileTransfer'), tool: 'file' as const },
        { icon: '◇', label: t('shake'), tool: 'location' as const },
        { icon: '◔', label: t('volume'), tool: 'audio' as const },
      ],
    },
  ]

  return (
    <div className="absolute right-0 top-8 z-20 w-[336px] rounded-[4px] border border-[#242832] bg-[#141922]/98 px-5 py-4 text-[12px] shadow-2xl backdrop-blur">
      {sections.map((section) => (
        <div key={section.title} className="mb-4 last:mb-0">
          <div className="mb-3 text-center text-[13px] font-medium text-white/58">{section.title}</div>
          <div className="grid grid-cols-4 gap-y-4">
            {section.items.map((item) => (
              <button
                key={`${section.title}-${item.label}`}
                onClick={() => onOpenTool(item.tool)}
                className="group flex min-h-[58px] flex-col items-center justify-start gap-1 rounded-[4px] px-1 text-center text-white/88 hover:bg-white/8"
              >
                <span className="grid h-7 place-items-center text-[22px] font-semibold leading-none text-white group-hover:text-[#12baf7]">{item.icon}</span>
                <span className="max-w-[70px] leading-4">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
      <button
        onClick={onStop}
        disabled={stopping}
        className="mt-1 flex h-9 w-full items-center justify-center rounded-[4px] border border-[#383d48] text-red-100 hover:bg-red-500/20 disabled:opacity-60"
      >
        <span className="mr-2 text-base">⏻</span>
        <span>{stopping ? t('stopping') : t('stop')}</span>
      </button>
    </div>
  )
}

type ToolActionModalProps = {
  tool: ToolId
  deviceName: string
  adbDeviceId: string
  recording: boolean
  recordSeconds: number
  onRecordingChange: (recording: boolean) => void
  volume: number
  onVolumeChange: (volume: number) => void
  micEnabled: boolean
  onMicEnabledChange: (enabled: boolean) => void
  syncEnabled: boolean
  onSyncEnabledChange: (enabled: boolean) => void
  windowPrefs: WindowPrefs
  onWindowPrefsChange: (prefs: WindowPrefs) => void
  onScreenshot: (path: string) => Promise<void>
  onToast: (message: string) => void
  onClose: () => void
}

function ToolActionModal({
  tool,
  deviceName,
  adbDeviceId,
  recording,
  recordSeconds,
  onRecordingChange,
  volume,
  onVolumeChange,
  micEnabled,
  onMicEnabledChange,
  syncEnabled,
  onSyncEnabledChange,
  windowPrefs,
  onWindowPrefsChange,
  onScreenshot,
  onToast,
  onClose,
}: ToolActionModalProps) {
  const { t } = useI18n()
  const [screenshotPath, setScreenshotPath] = useState(`Pictures/MuMu/${deviceName}-${Date.now()}.png`)
  const [captureBusy, setCaptureBusy] = useState(false)
  const [installItems, setInstallItems] = useState<string[]>([])
  const [recordScripts, setRecordScripts] = useState<string[]>([])
  const [transferItems, setTransferItems] = useState<string[]>(['MuMuSharedFolder', 'Download'])
  const [syncDelay, setSyncDelay] = useState(0)
  const [latitude, setLatitude] = useState('31.2304')
  const [longitude, setLongitude] = useState('121.4737')
  const [speakerEnabled, setSpeakerEnabled] = useState(true)
  const [keymapVisible, setKeymapVisible] = useState(true)

  const titleMap: Record<ToolId, string> = {
    navigation: t('navigationKeys'),
    keyboard: t('keyboardGamepad'),
    record: t('operationRecord'),
    audio: t('audio'),
    sync: t('syncTools'),
    location: t('virtualLocation'),
    window: t('windowManagement'),
    file: t('fileTransfer'),
    screenshot: t('screenshot'),
    developer: t('developerOptions'),
    settings: t('deviceSettings'),
    help: t('helpCenter'),
  }

  const addInstallItem = (name = 'debug-toolkit.apk') => {
    setInstallItems((items) => [...items, name])
    onToast(t('fileQueued'))
  }

  const capture = async () => {
    setCaptureBusy(true)
    try {
      await onScreenshot(screenshotPath)
    } finally {
      setCaptureBusy(false)
    }
  }

  const updateWindowPrefs = (patch: Partial<WindowPrefs>) => {
    onWindowPrefsChange({ ...windowPrefs, ...patch })
  }

  const toggleRecording = () => {
    if (recording) {
      const nextName = `${t('operationRecord')} ${recordScripts.length + 1}`
      setRecordScripts((scripts) => [nextName, ...scripts])
      onToast(t('scriptSaved'))
    }
    onRecordingChange(!recording)
  }

  const renderBody = () => {
    if (tool === 'screenshot') {
      return (
        <div className="space-y-4">
          <ToolField label={t('screenshotFormat')} value="PNG" />
          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-[#9c9c9c]">{t('screenshotPath')}</span>
            <input
              value={screenshotPath}
              onChange={(event) => setScreenshotPath(event.target.value)}
              className="h-10 w-full rounded-[4px] border border-[#4a4a4a] bg-[#191919] px-3 text-sm text-white outline-none focus:border-[#12baf7]"
            />
          </label>
          <button onClick={capture} disabled={captureBusy} className="h-10 w-full rounded-[4px] bg-[#12baf7] font-bold text-[#10212b] hover:bg-[#19c7ff] disabled:opacity-55">
            {captureBusy ? t('saving') : t('captureScreenshot')}
          </button>
          <div className="text-xs leading-5 text-[#858585]">{t('screenshotShortcut')}: Ctrl + P</div>
        </div>
      )
    }

    if (tool === 'record') {
      return (
        <div className="space-y-4">
          <div className="rounded-[4px] border border-[#3a3a3a] bg-[#171717] p-4">
            <div className="flex items-center gap-4">
              <div className={`h-4 w-4 rounded-full ${recording ? 'animate-pulse bg-[#ff4646]' : 'bg-[#555]'}`} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-[#9c9c9c]">{recording ? t('recording') : t('notRecording')}</div>
                <div className="font-mono text-3xl font-bold">{formatDuration(recordSeconds)}</div>
              </div>
              <button
                onClick={toggleRecording}
                className={`h-10 min-w-[108px] rounded-[4px] font-bold ${recording ? 'bg-[#5a2f2f] text-[#ffb0b0] hover:bg-[#6c3939]' : 'bg-[#12baf7] text-[#10212b] hover:bg-[#19c7ff]'}`}
              >
                {recording ? t('stopRecording') : t('newScript')}
              </button>
            </div>
          </div>
          <div className="rounded-[4px] border border-[#3a3a3a] bg-[#191919]">
            <div className="flex h-10 items-center border-b border-[#303030] px-3 text-xs font-semibold text-[#9c9c9c]">
              <span>{t('scriptList')}</span>
              <span className="ml-auto">{recordScripts.length}</span>
            </div>
            {recordScripts.length === 0 ? (
              <div className="px-3 py-4 text-sm text-[#777]">{t('noQueuedFiles')}</div>
            ) : (
              recordScripts.map((script) => (
                <div key={script} className="flex h-11 items-center gap-3 border-b border-[#2c2c2c] px-3 last:border-b-0">
                  <span className="text-[#12baf7]">●</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{script}</span>
                  <button onClick={() => onToast(t('syncActionSent'))} className="rounded-[4px] bg-[#12baf7] px-3 py-1 text-xs font-bold text-[#10212b]">{t('executeScript')}</button>
                  <button onClick={() => onToast(t('editScript'))} className="rounded-[4px] bg-[#3d3d3d] px-3 py-1 text-xs font-semibold hover:bg-[#555]">{t('editScript')}</button>
                </div>
              ))
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <ToolField label={t('loopSettings')} value={t('loopCount')} />
            <ToolField label={t('loopInterval')} value="0s" />
            <ToolField label={t('playbackSpeed')} value="1x" />
          </div>
          <ToggleLine label={t('humanSimulation')} enabled={true} onChange={() => onToast(t('applied'))} />
          <ToolField label={t('recordSavePath')} value="records/" />
          <ToolField label={t('recordShortcut')} value="Ctrl + 8" />
        </div>
      )
    }

    if (tool === 'file') {
      return (
        <div className="space-y-4">
          <div className="grid gap-3">
            <div className="rounded-[4px] border border-[#3a3a3a] bg-[#191919] p-3">
              <div className="mb-2 text-xs font-semibold text-[#9c9c9c]">{t('computerSharedPath')}</div>
              <div className="flex h-9 items-center gap-3 rounded-[3px] bg-[#252525] px-3">
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">C:\Users\Public\MuMuSharedFolder</span>
                <button onClick={() => onToast(t('folderOpened'))} className="rounded-[3px] bg-[#3d3d3d] px-3 py-1 text-xs font-semibold hover:bg-[#555]">{t('openComputerSharedFolder')}</button>
              </div>
            </div>
            <div className="rounded-[4px] border border-[#3a3a3a] bg-[#191919] p-3">
              <div className="mb-2 text-xs font-semibold text-[#9c9c9c]">{t('androidSharedPath')}</div>
              <div className="flex h-9 items-center gap-3 rounded-[3px] bg-[#252525] px-3">
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">/sdcard/MuMuSharedFolder</span>
                <button onClick={() => onToast(t('folderOpened'))} className="rounded-[3px] bg-[#3d3d3d] px-3 py-1 text-xs font-semibold hover:bg-[#555]">{t('openAndroidSharedFolder')}</button>
              </div>
            </div>
          </div>
          <button
            onClick={() => addInstallItem()}
            className="grid min-h-[116px] w-full place-items-center rounded-[4px] border border-dashed border-[#555] bg-[#191919] text-center hover:border-[#12baf7]"
          >
            <span>
              <span className="block text-2xl font-black text-[#12baf7]">APK</span>
              <span className="mt-2 block text-sm font-semibold">{t('dragToInstall')}</span>
              <span className="mt-1 block text-xs text-[#888]">{t('chooseFile')}</span>
            </span>
          </button>
          <div className="rounded-[4px] border border-[#3a3a3a] bg-[#191919]">
            <div className="border-b border-[#303030] px-3 py-2 text-xs font-semibold text-[#9c9c9c]">{t('installQueue')}</div>
            {installItems.length === 0 ? (
              <div className="px-3 py-4 text-sm text-[#777]">{t('noQueuedFiles')}</div>
            ) : (
              installItems.map((item, index) => (
                <div key={`${item}-${index}`} className="flex h-10 items-center border-b border-[#2c2c2c] px-3 last:border-b-0">
                  <span className="mr-3 text-[#12baf7]">▧</span>
                  <span className="min-w-0 flex-1 truncate text-sm">{item}</span>
                  <button onClick={() => onToast(t('apkInstallStarted'))} className="rounded-[4px] bg-[#3d3d3d] px-3 py-1 text-xs font-semibold hover:bg-[#555]">{t('installApk')}</button>
                </div>
              ))
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {transferItems.map((item) => (
              <button key={item} onClick={() => onToast(t('folderOpened'))} className="h-10 rounded-[4px] bg-[#303030] text-sm font-semibold hover:bg-[#3d3d3d]">
                {item}
              </button>
            ))}
          </div>
          <div className="rounded-[4px] border border-[#3a3a3a] bg-[#191919] px-3 py-2 text-xs leading-5 text-[#9c9c9c]">
            <span className="font-semibold text-[#d6d6d6]">{t('writableSystemDisk')}</span> · {t('rootRequiredHint')}
          </div>
          <button onClick={() => setTransferItems((items) => [...items, 'Pictures'])} className="h-10 w-full rounded-[4px] bg-[#454545] text-sm font-semibold hover:bg-[#555]">{t('addSharedFolder')}</button>
        </div>
      )
    }

    if (tool === 'sync') {
      return (
        <div className="space-y-4">
          <ToggleLine label={t('syncMode')} enabled={syncEnabled} onChange={onSyncEnabledChange} />
          <RangeLine label={t('syncDelay')} value={syncDelay} min={0} max={300} unit="ms" onChange={setSyncDelay} />
          <div className="grid grid-cols-2 gap-2">
            {[deviceName, t('allRunningDevices')].map((target) => (
              <button key={target} className="min-h-16 rounded-[4px] border border-[#3a3a3a] bg-[#191919] px-3 text-left text-sm font-semibold hover:border-[#12baf7]">
                <span className="block text-[#12baf7]">●</span>
                <span className="block truncate">{target}</span>
              </button>
            ))}
          </div>
          <button onClick={() => onToast(t('syncActionSent'))} className="h-10 w-full rounded-[4px] bg-[#12baf7] font-bold text-[#10212b] hover:bg-[#19c7ff]">{t('apply')}</button>
        </div>
      )
    }

    if (tool === 'location') {
      return (
        <div className="space-y-4">
          <div className="relative h-36 overflow-hidden rounded-[4px] border border-[#3a3a3a] bg-[#111]">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,186,247,0.12)_1px,transparent_1px),linear-gradient(rgba(18,186,247,0.12)_1px,transparent_1px)] bg-[size:28px_28px]" />
            <div className="absolute left-1/2 top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#12baf7] font-black text-[#10212b]">⌖</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className="mb-2 block text-xs text-[#9c9c9c]">{t('latitude')}</span>
              <input value={latitude} onChange={(event) => setLatitude(event.target.value)} className="h-10 w-full rounded-[4px] border border-[#4a4a4a] bg-[#191919] px-3 text-sm text-white outline-none focus:border-[#12baf7]" />
            </label>
            <label>
              <span className="mb-2 block text-xs text-[#9c9c9c]">{t('longitude')}</span>
              <input value={longitude} onChange={(event) => setLongitude(event.target.value)} className="h-10 w-full rounded-[4px] border border-[#4a4a4a] bg-[#191919] px-3 text-sm text-white outline-none focus:border-[#12baf7]" />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => onToast(`${t('locationApplied')}: ${latitude}, ${longitude}`)} className="h-10 rounded-[4px] bg-[#12baf7] font-bold text-[#10212b] hover:bg-[#19c7ff]">{t('setLocation')}</button>
            <button onClick={() => onToast(t('shakeSent'))} className="h-10 rounded-[4px] bg-[#454545] font-semibold hover:bg-[#555]">{t('shake')}</button>
          </div>
        </div>
      )
    }

    if (tool === 'window') {
      return (
        <div className="space-y-4">
          <ToggleLine label={t('alwaysOnTop')} enabled={windowPrefs.alwaysOnTop} onChange={(enabled) => updateWindowPrefs({ alwaysOnTop: enabled })} />
          <ToggleLine label={t('miniMode')} enabled={windowPrefs.miniMode} onChange={(enabled) => updateWindowPrefs({ miniMode: enabled })} />
          <ToggleLine label={t('fullscreen')} enabled={windowPrefs.fullscreen} onChange={(enabled) => updateWindowPrefs({ fullscreen: enabled })} />
          <RangeLine label={t('windowOpacity')} value={windowPrefs.opacity} min={30} max={100} unit="%" onChange={(opacity) => updateWindowPrefs({ opacity })} />
          <div className="grid grid-cols-3 gap-2">
            {[t('rotateScreen'), t('arrangeGrid'), t('reset')].map((action) => (
              <button key={action} onClick={() => onToast(`${action} ${t('applied')}`)} className="h-10 rounded-[4px] bg-[#303030] text-sm font-semibold hover:bg-[#3d3d3d]">{action}</button>
            ))}
          </div>
        </div>
      )
    }

    if (tool === 'audio') {
      return (
        <div className="space-y-4">
          <ToggleLine label={t('speaker')} enabled={speakerEnabled} onChange={setSpeakerEnabled} />
          <ToggleLine label={t('microphone')} enabled={micEnabled} onChange={onMicEnabledChange} />
          <RangeLine label={t('volume')} value={volume} min={0} max={100} unit="%" onChange={onVolumeChange} />
          <button onClick={() => onToast(t('audioApplied'))} className="h-10 w-full rounded-[4px] bg-[#12baf7] font-bold text-[#10212b] hover:bg-[#19c7ff]">{t('apply')}</button>
        </div>
      )
    }

    if (tool === 'keyboard') {
      return (
        <div className="space-y-4">
          <ToggleLine label={t('keymapSwitch')} enabled={keymapVisible} onChange={setKeymapVisible} />
          <div className="grid grid-cols-2 gap-2">
            {[[t('wasdMovement'), 'W A S D'], [t('fireKey'), 'Left Click'], [t('back'), 'Esc'], [t('home'), 'Home']].map(([label, value]) => (
              <ToolField key={label} label={label} value={value} />
            ))}
          </div>
          <button onClick={() => onToast(t('keymapApplied'))} className="h-10 w-full rounded-[4px] bg-[#12baf7] font-bold text-[#10212b] hover:bg-[#19c7ff]">{t('save')}</button>
        </div>
      )
    }

    if (tool === 'navigation') {
      return (
        <div className="grid grid-cols-3 gap-3">
          {[t('back'), t('home'), t('recentTasks')].map((action) => (
            <button key={action} onClick={() => onToast(`${action} ${t('applied')}`)} className="min-h-24 rounded-[4px] bg-[#191919] text-lg font-semibold hover:bg-[#303030]">{action}</button>
          ))}
        </div>
      )
    }

    const rows: Array<[string, string]> = tool === 'developer'
      ? [[t('adbEndpoint'), adbDeviceId || '127.0.0.1:7555'], [t('rootPermission'), t('disabled')], [t('networkMode'), 'NAT'], [t('renderer'), 'Vulkan']]
      : tool === 'settings'
        ? [[t('resolutionSettings'), '1280 x 720'], [t('frameRate'), '120 FPS'], [t('renderer'), 'Vulkan'], [t('performance'), t('extremePerformance')]]
        : [[t('helpCenter'), t('enabled')], [t('feedback'), t('available')], [t('versionInfo'), 'MuMu Dev UI']]

    return (
      <div className="space-y-2">
        {rows.map(([label, value]) => <ToolField key={label} label={label} value={value} />)}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45">
      <div className="w-[520px] max-w-[calc(100vw-32px)] overflow-hidden rounded-[4px] border border-[#484848] bg-[#303030] text-white shadow-2xl">
        <div className="flex h-[54px] items-center border-b border-[#242424] px-5">
          <div>
            <div className="text-[17px] font-semibold">{titleMap[tool]}</div>
            <div className="mt-0.5 text-xs text-[#858585]">{deviceName}</div>
          </div>
          <button onClick={onClose} className="ml-auto grid h-9 w-9 place-items-center rounded-[4px] text-xl text-white/70 hover:bg-white/10">×</button>
        </div>
        <div className="max-h-[calc(100vh-160px)] overflow-y-auto p-5">
          {renderBody()}
        </div>
        <div className="flex justify-end gap-3 border-t border-[#242424] px-5 py-4">
          <button onClick={onClose} className="h-10 min-w-[96px] rounded-[4px] border border-[#555] bg-[#3d3d3d] px-5 text-sm font-semibold hover:bg-[#4a4a4a]">{t('close')}</button>
        </div>
      </div>
    </div>
  )
}

function ToolField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-12 items-center rounded-[4px] border border-[#3a3a3a] bg-[#191919] px-4">
      <span className="text-sm font-semibold text-[#bcbcbc]">{label}</span>
      <span className="ml-auto max-w-[260px] truncate text-sm font-bold text-white">{value}</span>
    </div>
  )
}

function ToggleLine({ label, enabled, onChange }: { label: string; enabled: boolean; onChange: (enabled: boolean) => void }) {
  const { t } = useI18n()
  return (
    <div className="flex min-h-12 items-center rounded-[4px] border border-[#3a3a3a] bg-[#191919] px-4">
      <span className="text-sm font-semibold text-[#d6d6d6]">{label}</span>
      <span className="ml-auto mr-3 text-xs text-[#858585]">{enabled ? t('enabled') : t('disabled')}</span>
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`relative h-6 w-11 rounded-full transition-colors ${enabled ? 'bg-[#12baf7]' : 'bg-[#555]'}`}
      >
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  )
}

function RangeLine({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  unit: string
  onChange: (value: number) => void
}) {
  return (
    <label className="block rounded-[4px] border border-[#3a3a3a] bg-[#191919] px-4 py-3">
      <span className="mb-3 flex items-center text-sm font-semibold text-[#d6d6d6]">
        {label}
        <span className="ml-auto text-white">{value}{unit}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-[#12baf7]"
      />
    </label>
  )
}
