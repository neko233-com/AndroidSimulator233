import { useMemo, useState } from 'react'
import { useI18n } from '../lib/i18n'
import type { VMInfo } from '../lib/types'
import { GoBridge, formatNativeError } from '../lib/types'

type DeviceSettingsDialogProps = {
  vm: VMInfo
  onClose: () => void
  onSaved: () => void
}

type SettingsTab = 'performance' | 'display' | 'audio' | 'network' | 'model' | 'developer' | 'other'

const resolutions = ['960x540', '1280x720', '1600x900', '1920x1080', '2560x1440']
const cpuOptions = [1, 2, 4, 6, 8, 12, 16]
const ramOptions = ['1G', '2G', '3G', '4G', '6G', '8G', '12G', '16G']
const dpiOptions = [160, 240, 320, 360, 480]
const fpsOptions = [30, 60, 90, 120, 144, 240]
const phoneOptions = [
  ['Xiaomi', '14 Ultra'],
  ['Samsung', 'Galaxy S24 Ultra'],
  ['Google', 'Pixel 9 Pro'],
  ['OnePlus', '12'],
]

export function DeviceSettingsDialog({ vm, onClose, onSaved }: DeviceSettingsDialogProps) {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<SettingsTab>('performance')
  const [cpus, setCPUs] = useState(vm.cpus || 2)
  const [ram, setRAM] = useState(vm.ram || '2G')
  const [resolution, setResolution] = useState(vm.resolution || '1280x720')
  const [dpi, setDPI] = useState(vm.dpi || 240)
  const [performance, setPerformance] = useState(vm.performance || 'middle')
  const [renderer, setRenderer] = useState(vm.renderer || 'vulkan')
  const [maxFPS, setMaxFPS] = useState(vm.maxFps || 60)
  const [root, setRoot] = useState(Boolean(vm.root))
  const [phoneBrand, setPhoneBrand] = useState(vm.phoneBrand || 'Xiaomi')
  const [phoneModel, setPhoneModel] = useState(vm.phoneModel || '14 Ultra')
  const [saving, setSaving] = useState(false)

  const tabs = useMemo(
    () => [
      { id: 'performance' as const, icon: '▧', label: t('performance') },
      { id: 'display' as const, icon: '▣', label: t('display') },
      { id: 'audio' as const, icon: '◖', label: t('audio') },
      { id: 'network' as const, icon: '◎', label: t('network') },
      { id: 'model' as const, icon: '▯', label: t('phoneModel') },
      { id: 'developer' as const, icon: '▱', label: t('developerOptions') },
      { id: 'other' as const, icon: '▦', label: t('other') },
    ],
    [t]
  )

  const save = async () => {
    setSaving(true)
    try {
      await GoBridge.UpdateVMConfig(
        vm.name,
        vm.android || 'android-15',
        cpus,
        ram,
        resolution,
        dpi,
        performance,
        renderer,
        maxFPS,
        root,
        phoneBrand,
        phoneModel
      )
      onSaved()
      onClose()
    } catch (err) {
      alert(t('saveFailed') + formatNativeError(err))
    } finally {
      setSaving(false)
    }
  }

  const selectPhone = (value: string) => {
    const [brand, model] = value.split('|')
    setPhoneBrand(brand)
    setPhoneModel(model)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="h-[min(900px,calc(100vh-36px))] w-[min(1380px,calc(100vw-36px))] overflow-hidden rounded-lg border border-white/15 bg-[#202020] shadow-2xl">
        <div className="flex h-14 items-center border-b border-white/10 px-6">
          <div className="text-xl">{t('deviceSettings')}</div>
          <div className="ml-4 text-sm text-gray-400">{vm.name}</div>
          <button type="button" onClick={onClose} className="ml-auto grid h-10 w-10 place-items-center rounded hover:bg-white/10">
            ×
          </button>
        </div>

        <div className="flex h-[calc(100%-56px)]">
          <nav className="w-[360px] flex-none px-6 py-7">
            <div className="space-y-3">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex h-[72px] w-full items-center gap-5 rounded-md px-8 text-left text-xl ${
                    activeTab === tab.id ? 'border-l-4 border-sky-400 bg-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  <span className="w-8 text-2xl">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </nav>

          <main className="min-w-0 flex-1 overflow-y-auto px-9 py-8">
            <h2 className="mb-8 text-[34px] font-medium">{tabs.find((tab) => tab.id === activeTab)?.label}</h2>
            {activeTab === 'performance' && (
              <div className="max-w-5xl space-y-2">
                <SelectRow icon="▧" label={t('renderer')} value={renderer} onChange={setRenderer} options={[
                  ['vulkan', 'Vulkan'],
                  ['directx', 'DirectX'],
                ]} />
                <SelectRow icon="▤" label={t('performance')} value={performance} onChange={setPerformance} options={[
                  ['low', t('lowPower')],
                  ['middle', t('balanced')],
                  ['high', t('highPerformance')],
                  ['custom', t('custom')],
                ]} />
                <SelectRow icon="▥" label={t('cpu')} value={String(cpus)} onChange={(value) => setCPUs(Number(value))} options={cpuOptions.map((value) => [String(value), `${value} ${t('cores')}`])} />
                <SelectRow icon="▥" label={t('memory')} value={ram} onChange={setRAM} options={ramOptions.map((value) => [value, value])} />
                <ToggleRow icon="□" label={t('rootPermission')} enabled={root} onChange={setRoot} enabledLabel={t('enabled')} disabledLabel={t('disabled')} />
              </div>
            )}

            {activeTab === 'display' && (
              <div className="max-w-5xl space-y-2">
                <SelectRow icon="▣" label={t('resolutionSettings')} value={resolution} onChange={setResolution} options={resolutions.map((value) => [value, value.replace('x', ' × ')])} />
                <SelectRow icon="FPS" label={t('frameRate')} value={String(maxFPS)} onChange={(value) => setMaxFPS(Number(value))} options={fpsOptions.map((value) => [String(value), `${value} FPS`])} />
                <SelectRow icon="▧" label={t('dpi')} value={String(dpi)} onChange={(value) => setDPI(Number(value))} options={dpiOptions.map((value) => [String(value), String(value)])} />
                <StaticRow icon="▢" label={t('screenSettings')} value={t('landscapeDisplay')} />
                <StaticRow icon="⌖" label={t('windowPositionSize')} value={t('followDeviceResolution')} />
                <ToggleRow icon="◌" label={t('cursorStyle')} enabled={true} onChange={() => undefined} enabledLabel={t('enabled')} disabledLabel={t('disabled')} />
              </div>
            )}

            {activeTab === 'audio' && (
              <div className="max-w-5xl space-y-2">
                <StaticRow icon="◖" label={t('speaker')} value={t('enabled')} />
                <StaticRow icon="◉" label={t('microphone')} value={t('disabled')} />
              </div>
            )}

            {activeTab === 'network' && (
              <div className="max-w-5xl space-y-2">
                <StaticRow icon="◎" label={t('networkMode')} value="NAT" />
                <StaticRow icon="↔" label={t('adbEndpoint')} value={vm.adbPort ? `127.0.0.1:${vm.adbPort}` : t('notAssigned')} />
              </div>
            )}

            {activeTab === 'model' && (
              <div className="max-w-5xl space-y-2">
                <SelectRow icon="▯" label={t('phoneModel')} value={`${phoneBrand}|${phoneModel}`} onChange={selectPhone} options={phoneOptions.map(([brand, model]) => [`${brand}|${model}`, `${brand} ${model}`])} />
                <StaticRow icon="ID" label={t('androidVersion')} value={(vm.android || 'android-15').replace('android-', 'Android ')} />
              </div>
            )}

            {activeTab === 'developer' && (
              <div className="max-w-5xl space-y-2">
                <StaticRow icon="ADB" label={t('adbEndpoint')} value={vm.adbPort ? `127.0.0.1:${vm.adbPort}` : t('notAssigned')} />
                <ToggleRow icon="□" label={t('rootPermission')} enabled={root} onChange={setRoot} enabledLabel={t('enabled')} disabledLabel={t('disabled')} />
              </div>
            )}

            {activeTab === 'other' && (
              <div className="max-w-5xl space-y-2">
                <StaticRow icon="▦" label={t('diskCleanup')} value={t('availableAfterShutdown')} />
                <StaticRow icon="↺" label={t('backupRestore')} value={t('availableAfterShutdown')} />
              </div>
            )}

            <div className="mt-8 flex max-w-5xl justify-end gap-3 border-t border-white/10 pt-5">
              <button type="button" onClick={onClose} className="h-11 min-w-28 rounded bg-white/10 px-5 hover:bg-white/15" disabled={saving}>
                {t('cancel')}
              </button>
              <button type="button" onClick={save} className="h-11 min-w-32 rounded bg-sky-500 px-5 font-medium text-black hover:bg-sky-400" disabled={saving}>
                {saving ? t('saving') : t('save')}
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

type SelectRowProps = {
  icon: string
  label: string
  value: string
  options: Array<[string, string]>
  onChange: (value: string) => void
}

function SelectRow({ icon, label, value, options, onChange }: SelectRowProps) {
  return (
    <label className="flex min-h-[102px] items-center rounded-md bg-white/10 px-8">
      <span className="mr-7 w-12 text-2xl">{icon}</span>
      <span className="text-xl">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="ml-auto h-12 min-w-[180px] rounded border border-white/15 bg-[#3a3a3a] px-4 text-xl text-white outline-none"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
      <span className="ml-7 text-2xl text-gray-300">⌄</span>
    </label>
  )
}

function StaticRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex min-h-[102px] items-center rounded-md bg-white/10 px-8">
      <span className="mr-7 w-12 text-2xl">{icon}</span>
      <span className="text-xl">{label}</span>
      <span className="ml-auto text-xl text-white">{value}</span>
      <span className="ml-7 text-2xl text-gray-300">⌄</span>
    </div>
  )
}

function ToggleRow({
  icon,
  label,
  enabled,
  onChange,
  enabledLabel,
  disabledLabel,
}: {
  icon: string
  label: string
  enabled: boolean
  onChange: (enabled: boolean) => void
  enabledLabel: string
  disabledLabel: string
}) {
  return (
    <div className="flex min-h-[102px] items-center rounded-md bg-white/10 px-8">
      <span className="mr-7 w-12 text-2xl">{icon}</span>
      <span className="text-xl">{label}</span>
      <span className="ml-auto mr-5 text-xl">{enabled ? enabledLabel : disabledLabel}</span>
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`relative h-8 w-16 rounded-full transition-colors ${enabled ? 'bg-sky-500' : 'bg-white/20'}`}
      >
        <span className={`absolute top-1 h-6 w-6 rounded-full bg-[#3a3a3a] transition-transform ${enabled ? 'translate-x-8' : 'translate-x-1'}`} />
      </button>
    </div>
  )
}
