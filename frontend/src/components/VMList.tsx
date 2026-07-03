import { useState } from 'react'
import { VMCard } from './VMCard'
import { useI18n } from '../lib/i18n'
import type { VMInfo } from '../lib/types'
import { GoBridge } from '../lib/types'

interface VMListProps {
  vms: VMInfo[]
  loading: boolean
  onRefresh: () => void
  onOpen: (name: string) => void
}

export function VMList({ vms, loading, onRefresh, onOpen }: VMListProps) {
  const { t } = useI18n()
  const [showCreate, setShowCreate] = useState(false)
  const [newVMName, setNewVMName] = useState('')
  const [selectedAndroid, setSelectedAndroid] = useState('android-15')
  const [selectedPreset, setSelectedPreset] = useState<'low' | 'middle' | 'high' | 'custom'>('middle')
  const [selectedCPUs, setSelectedCPUs] = useState(2)
  const [selectedRAM, setSelectedRAM] = useState('2G')
  const [selectedResolution, setSelectedResolution] = useState('1280x720')
  const [selectedDPI, setSelectedDPI] = useState(240)
  const [selectedRenderer, setSelectedRenderer] = useState('vulkan')
  const [selectedMaxFPS, setSelectedMaxFPS] = useState(60)
  const [rootEnabled, setRootEnabled] = useState(false)
  const [phoneBrand, setPhoneBrand] = useState('Xiaomi')
  const [phoneModel, setPhoneModel] = useState('14 Ultra')
  const [creating, setCreating] = useState(false)

  const applyPreset = (preset: 'low' | 'middle' | 'high' | 'custom') => {
    setSelectedPreset(preset)
    if (preset === 'low') {
      setSelectedCPUs(1)
      setSelectedRAM('1G')
      setSelectedResolution('960x540')
      setSelectedDPI(160)
      setSelectedMaxFPS(30)
    }
    if (preset === 'middle') {
      setSelectedCPUs(2)
      setSelectedRAM('2G')
      setSelectedResolution('1280x720')
      setSelectedDPI(240)
      setSelectedMaxFPS(60)
    }
    if (preset === 'high') {
      setSelectedCPUs(6)
      setSelectedRAM('12G')
      setSelectedResolution('2560x1440')
      setSelectedDPI(360)
      setSelectedMaxFPS(120)
    }
  }

  const getErrorMessage = (err: unknown) => {
    if (err instanceof Error) return err.message
    return String(err)
  }

  const handleCreate = async () => {
    if (!newVMName.trim()) return

    setCreating(true)

    try {
      const hasConfiguredCreate = Boolean(
        window.GoBridge?.CreateVMWithConfig || window.CreateVMWithConfig
      )
      const vm = hasConfiguredCreate
        ? await GoBridge.CreateVMWithConfig(
            newVMName.trim(),
            selectedAndroid,
            selectedCPUs,
            selectedRAM,
            selectedResolution,
            selectedDPI,
            selectedPreset,
            selectedRenderer,
            selectedMaxFPS,
            rootEnabled,
            phoneBrand,
            phoneModel
          )
        : await GoBridge.CreateVM(newVMName.trim(), selectedAndroid)
      setShowCreate(false)
      setNewVMName('')
      onRefresh()
      onOpen(vm.name)
    } catch (err) {
      alert(t('createFailed') + getErrorMessage(err))
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (name: string) => {
    if (!confirm(t('deleteConfirm').replace('{name}', name))) return

    try {
      await GoBridge.DeleteVM(name)
      onRefresh()
    } catch (err) {
      alert(t('deleteFailed') + err)
    }
  }

  const handleStart = async (name: string) => {
    try {
      await GoBridge.StartVM(name)
      onRefresh()
      onOpen(name)
    } catch (err) {
      alert(t('startFailed') + err)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500" />
          <div className="text-gray-400">{t('loadingDevices')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('multiInstanceTitle')}</h2>
          <p className="mt-1 text-sm text-gray-400">{t('multiInstanceSubtitle')}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 hover:bg-blue-500"
        >
          <span>+</span>
          <span>{t('createDevice')}</span>
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-h-[calc(100vh-48px)] w-[680px] max-w-[calc(100vw-32px)] overflow-y-auto rounded-lg bg-gray-800 p-6">
            <h3 className="mb-4 text-lg font-bold">{t('createNewDevice')}</h3>

            <div className="mb-4">
              <label className="mb-2 block text-sm text-gray-400">{t('deviceName')}</label>
              <input
                type="text"
                value={newVMName}
                onChange={(e) => setNewVMName(e.target.value)}
                placeholder={t('deviceName')}
                className="w-full rounded bg-gray-700 px-3 py-2 text-white"
                autoFocus
                disabled={creating}
              />
            </div>

            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-gray-400">{t('androidVersion')}</label>
                <select
                  value={selectedAndroid}
                  onChange={(e) => setSelectedAndroid(e.target.value)}
                  className="w-full rounded bg-gray-700 px-3 py-2 text-white"
                  disabled={creating}
                >
                  <option value="android-15">Android 15 ({t('recommended')})</option>
                  <option value="android-14">Android 14</option>
                  <option value="android-12">Android 12</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-400">{t('resolution')}</label>
                <select
                  value={selectedResolution}
                  onChange={(e) => {
                    setSelectedPreset('custom')
                    setSelectedResolution(e.target.value)
                  }}
                  className="w-full rounded bg-gray-700 px-3 py-2 text-white"
                  disabled={creating}
                >
                  <option value="960x540">960 x 540</option>
                  <option value="1280x720">1280 x 720 ({t('recommended')})</option>
                  <option value="1600x900">1600 x 900</option>
                  <option value="1920x1080">1920 x 1080</option>
                  <option value="2560x1440">2560 x 1440</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm text-gray-400">{t('performance')}</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'low' as const, label: t('lowPower') },
                  { id: 'middle' as const, label: t('balanced') },
                  { id: 'high' as const, label: t('highPerformance') },
                  { id: 'custom' as const, label: t('custom') },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset.id)}
                    className={`rounded px-3 py-2 text-sm ${
                      selectedPreset === preset.id ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                    }`}
                    disabled={creating}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-gray-400">{t('cpu')}</label>
                <select
                  value={selectedCPUs}
                  onChange={(e) => {
                    setSelectedPreset('custom')
                    setSelectedCPUs(Number(e.target.value))
                  }}
                  className="w-full rounded bg-gray-700 px-3 py-2 text-white"
                  disabled={creating}
                >
                  {[1, 2, 4, 6, 8].map((cpus) => (
                    <option key={cpus} value={cpus}>{cpus} {t('cores')}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-400">{t('memory')}</label>
                <select
                  value={selectedRAM}
                  onChange={(e) => {
                    setSelectedPreset('custom')
                    setSelectedRAM(e.target.value)
                  }}
                  className="w-full rounded bg-gray-700 px-3 py-2 text-white"
                  disabled={creating}
                >
                  {['1G', '2G', '3G', '4G', '6G', '8G', '12G', '16G'].map((ram) => (
                    <option key={ram} value={ram}>{ram}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm text-gray-400">{t('dpi')}</label>
                <select
                  value={selectedDPI}
                  onChange={(e) => {
                    setSelectedPreset('custom')
                    setSelectedDPI(Number(e.target.value))
                  }}
                  className="w-full rounded bg-gray-700 px-3 py-2 text-white"
                  disabled={creating}
                >
                  {[160, 240, 320, 360, 480].map((dpi) => (
                    <option key={dpi} value={dpi}>{dpi}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-400">{t('frameRate')}</label>
                <select
                  value={selectedMaxFPS}
                  onChange={(e) => {
                    setSelectedPreset('custom')
                    setSelectedMaxFPS(Number(e.target.value))
                  }}
                  className="w-full rounded bg-gray-700 px-3 py-2 text-white"
                  disabled={creating}
                >
                  {[30, 60, 90, 120, 144, 240].map((fps) => (
                    <option key={fps} value={fps}>{fps} FPS</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-400">{t('renderer')}</label>
                <select
                  value={selectedRenderer}
                  onChange={(e) => setSelectedRenderer(e.target.value)}
                  className="w-full rounded bg-gray-700 px-3 py-2 text-white"
                  disabled={creating}
                >
                  <option value="vulkan">Vulkan</option>
                  <option value="directx">DirectX</option>
                </select>
              </div>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="flex items-center gap-3 rounded bg-gray-700 px-3 py-2">
                <input
                  type="checkbox"
                  checked={rootEnabled}
                  onChange={(e) => setRootEnabled(e.target.checked)}
                  disabled={creating}
                />
                <span className="text-sm">{t('rootPermission')}</span>
              </label>

              <div>
                <label className="mb-2 block text-sm text-gray-400">{t('phoneModel')}</label>
                <select
                  value={`${phoneBrand}|${phoneModel}`}
                  onChange={(e) => {
                    const [brand, model] = e.target.value.split('|')
                    setPhoneBrand(brand)
                    setPhoneModel(model)
                  }}
                  className="w-full rounded bg-gray-700 px-3 py-2 text-white"
                  disabled={creating}
                >
                  <option value="Xiaomi|14 Ultra">Xiaomi 14 Ultra</option>
                  <option value="Samsung|Galaxy S24 Ultra">Samsung Galaxy S24 Ultra</option>
                  <option value="Google|Pixel 9 Pro">Google Pixel 9 Pro</option>
                  <option value="OnePlus|12">OnePlus 12</option>
                </select>
              </div>
            </div>

            {creating && (
              <div className="mb-4 rounded bg-blue-900/50 p-3">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-400" />
                  <span className="text-sm">{t('creating')}</span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 rounded bg-gray-600 px-4 py-2 hover:bg-gray-500"
                disabled={creating}
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 rounded bg-blue-600 px-4 py-2 hover:bg-blue-500"
                disabled={creating || !newVMName.trim()}
              >
                {creating ? t('creating') : t('create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {vms.length === 0 ? (
        <div className="py-16 text-center">
          <div className="mb-4 text-6xl">▣</div>
          <h3 className="mb-2 text-xl font-bold">{t('noDevicesYet')}</h3>
          <p className="mb-6 text-gray-400">{t('createFirstDevice')}</p>
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-lg bg-blue-600 px-6 py-3 hover:bg-blue-500"
          >
            {t('createDevice')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vms.map((vm) => (
            <VMCard
              key={vm.name}
              vm={vm}
              onStart={handleStart}
              onDelete={handleDelete}
              onOpen={onOpen}
            />
          ))}
        </div>
      )}

      <div className="mt-8 rounded-lg bg-gray-800 p-4">
        <h3 className="mb-2 font-bold">{t('preinstalledApps')}</h3>
        <p className="mb-3 text-sm text-gray-400">{t('preinstalledAppsHint')}</p>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-gray-700 px-3 py-1 text-sm">Chrome</span>
          <span className="rounded-full bg-gray-700 px-3 py-1 text-sm">TapTap</span>
          <span className="rounded-full bg-gray-700 px-3 py-1 text-sm">Play Store</span>
          <span className="rounded-full bg-gray-700 px-3 py-1 text-sm">Play Services</span>
        </div>
      </div>
    </div>
  )
}
