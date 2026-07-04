import { useEffect, useMemo, useState } from 'react'
import { VMCard } from './VMCard'
import { DeviceSettingsDialog } from './DeviceSettingsDialog'
import { useI18n } from '../lib/i18n'
import type { VMInfo } from '../lib/types'
import { GoBridge, formatNativeError } from '../lib/types'

interface VMListProps {
  vms: VMInfo[]
  loading: boolean
  onRefresh: () => void
  onOpen: (name: string) => void
}

export function VMList({ vms, loading, onRefresh, onOpen }: VMListProps) {
  const { t } = useI18n()
  const [showCreate, setShowCreate] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortMenuOpen, setSortMenuOpen] = useState(false)
  const [sortMode, setSortMode] = useState<'name' | 'status' | 'android' | 'performance'>('name')
  const [viewMode, setViewMode] = useState<'detail' | 'list'>('detail')
  const [batchMode, setBatchMode] = useState(false)
  const [batchMoreOpen, setBatchMoreOpen] = useState(false)
  const [batchBusy, setBatchBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [selectedNames, setSelectedNames] = useState<Set<string>>(() => new Set())
  const [arrangeOpen, setArrangeOpen] = useState(false)
  const [arrangeNoticeOpen, setArrangeNoticeOpen] = useState(false)
  const [newVMName, setNewVMName] = useState('')
  const [selectedAndroid] = useState('android-12')
  const [selectedPreset, setSelectedPreset] = useState<'low' | 'middle' | 'high' | 'custom'>('high')
  const [selectedCPUs, setSelectedCPUs] = useState(6)
  const [selectedRAM, setSelectedRAM] = useState('12G')
  const [selectedResolution, setSelectedResolution] = useState('1280x720')
  const [selectedDPI, setSelectedDPI] = useState(240)
  const [selectedRenderer] = useState('vulkan')
  const [selectedMaxFPS, setSelectedMaxFPS] = useState(120)
  const [rootEnabled, setRootEnabled] = useState(false)
  const [phoneBrand] = useState('Xiaomi')
  const [phoneModel] = useState('14 Ultra')
  const [screenDirection, setScreenDirection] = useState<'landscape' | 'portrait'>('landscape')
  const [deviceQuantity, setDeviceQuantity] = useState(1)
  const [smallDiskMode, setSmallDiskMode] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [settingsVM, setSettingsVM] = useState<VMInfo | null>(null)
  const [startingNames, setStartingNames] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    setStartingNames((previous) => {
      const next = new Set(previous)
      for (const vm of vms) {
        if (vm.status === 'running' || vm.status === 'error') {
          next.delete(vm.name)
        }
      }
      return next.size === previous.size ? previous : next
    })
  }, [vms])

  useEffect(() => {
    setSelectedNames((previous) => {
      const existing = new Set(vms.map((vm) => vm.name))
      const next = new Set([...previous].filter((name) => existing.has(name)))
      return next.size === previous.size ? previous : next
    })
  }, [vms])

  const visibleVMs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const filtered = query
      ? vms.filter((vm) => {
          const searchable = [
            vm.name,
            vm.android,
            vm.status,
            vm.performance,
            vm.resolution,
            vm.renderer,
            vm.phoneBrand,
            vm.phoneModel,
          ].filter(Boolean).join(' ').toLowerCase()
          return searchable.includes(query)
        })
      : vms

    return [...filtered].sort((a, b) => {
      if (sortMode === 'status') return (a.status ?? '').localeCompare(b.status ?? '') || a.name.localeCompare(b.name)
      if (sortMode === 'android') return (a.android ?? '').localeCompare(b.android ?? '') || a.name.localeCompare(b.name)
      if (sortMode === 'performance') return (a.performance ?? '').localeCompare(b.performance ?? '') || a.name.localeCompare(b.name)
      return a.name.localeCompare(b.name)
    })
  }, [searchQuery, sortMode, vms])

  const selectedVMs = useMemo(
    () => vms.filter((vm) => selectedNames.has(vm.name)),
    [selectedNames, vms]
  )

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 1600)
    return () => window.clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    if (selectedNames.size === 0) setBatchMoreOpen(false)
  }, [selectedNames.size])

  const toggleSelected = (name: string) => {
    setSelectedNames((previous) => {
      const next = new Set(previous)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const selectAllVisible = () => {
    setSelectedNames(new Set(visibleVMs.map((vm) => vm.name)))
  }

  const clearSelection = () => {
    setSelectedNames(new Set())
  }

  const exitBatchMode = () => {
    clearSelection()
    setBatchMoreOpen(false)
    setBatchMode(false)
  }

  const selectedCountLabel = t('selectedCount').replace('{count}', String(selectedNames.size))

  const runBatchAction = async (action: 'start' | 'stop' | 'delete') => {
    if (selectedVMs.length === 0 || batchBusy) return
    if (action === 'delete') {
      const confirmed = window.confirm(t('batchDeleteConfirm').replace('{count}', String(selectedVMs.length)))
      if (!confirmed) return
    }

    setBatchBusy(true)
    setBatchMoreOpen(false)
    try {
      if (action === 'start') {
        setStartingNames((previous) => {
          const next = new Set(previous)
          selectedVMs.forEach((vm) => {
            if (vm.status !== 'running') next.add(vm.name)
          })
          return next
        })
        await Promise.all(selectedVMs.filter((vm) => vm.status !== 'running').map((vm) => GoBridge.StartVM(vm.name)))
      }
      if (action === 'stop') {
        await Promise.all(selectedVMs.filter((vm) => vm.status === 'running').map((vm) => GoBridge.StopVM(vm.name)))
      }
      if (action === 'delete') {
        await Promise.all(selectedVMs.map((vm) => GoBridge.DeleteVM(vm.name)))
        clearSelection()
      }
      setNotice(t('batchActionComplete'))
      onRefresh()
    } catch (err) {
      setNotice(t('batchActionFailed') + formatNativeError(err))
    } finally {
      if (action === 'start') {
        setStartingNames((previous) => {
          const next = new Set(previous)
          selectedVMs.forEach((vm) => next.delete(vm.name))
          return next
        })
      }
      setBatchBusy(false)
    }
  }

  const openArrangeFlow = () => {
    setSortMenuOpen(false)
    if (!vms.some((vm) => vm.status === 'running')) {
      setArrangeNoticeOpen(true)
      setArrangeOpen(false)
      return
    }
    setArrangeOpen((open) => !open)
  }

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

  const handleCreate = async () => {
    const baseName = newVMName.trim() || t('mumuAndroidDevice')
    const quantity = Math.max(1, Math.min(deviceQuantity, 99))

    setCreating(true)

    try {
      const hasConfiguredCreate = Boolean(
        window.GoBridge?.CreateVMWithConfig || window.CreateVMWithConfig
      )
      let openedName = ''
      for (let index = 0; index < quantity; index += 1) {
        const deviceName = newVMName.trim()
          ? quantity === 1 ? baseName : `${baseName}-${index + 1}`
          : `${baseName}-${vms.length + index + 1}`
        const vm = hasConfiguredCreate
          ? await GoBridge.CreateVMWithConfig(
              deviceName,
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
          : await GoBridge.CreateVM(deviceName, selectedAndroid)
        openedName = vm.name
      }
      setShowCreate(false)
      setNewVMName('')
      onRefresh()
      if (openedName) onOpen(openedName)
    } catch (err) {
      alert(t('createFailed') + formatNativeError(err))
    } finally {
      setCreating(false)
    }
  }

  const handleStart = async (name: string) => {
    setStartingNames((previous) => new Set(previous).add(name))
    try {
      await GoBridge.StartVM(name)
      onRefresh()
    } catch (err) {
      setStartingNames((previous) => {
        const next = new Set(previous)
        next.delete(name)
        return next
      })
      alert(t('startFailed') + formatNativeError(err))
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#2f2f2f]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-[#12baf7]" />
          <div className="font-medium text-[#bfbfbf]">{t('loadingDevices')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#2f2f2f] pb-6">
      <div className="flex min-h-[72px] flex-wrap items-center gap-3 bg-[#2f2f2f] px-5 py-3 sm:gap-4 sm:px-6">
        {batchMode ? (
          <>
            <button onClick={selectedNames.size === visibleVMs.length ? clearSelection : selectAllVisible} className="flex h-9 items-center gap-2 whitespace-nowrap rounded-[4px] px-1 pr-4 text-[14px] font-semibold text-white hover:bg-white/5">
              <span className={`grid h-[22px] w-[22px] place-items-center rounded-[4px] border ${selectedNames.size === visibleVMs.length && visibleVMs.length > 0 ? 'border-[#12baf7] bg-[#12baf7] text-[#10212b]' : 'border-[#8a8a8a]'}`}>
                {selectedNames.size === visibleVMs.length && visibleVMs.length > 0 ? '✓' : ''}
              </span>
              <span>{t('selectAll')}</span>
            </button>
            <div className="hidden min-w-[82px] text-[13px] font-semibold text-[#bdbdbd] sm:block">{selectedCountLabel}</div>
            <button
              type="button"
              onClick={() => runBatchAction('start')}
              disabled={selectedNames.size === 0 || batchBusy}
              className="flex h-9 items-center gap-2 rounded-[4px] bg-[#555] px-6 text-[14px] font-bold text-white/45 enabled:text-white enabled:hover:bg-[#5f5f5f] disabled:cursor-not-allowed"
            >
              <span>▶</span>
              <span>{t('start')}</span>
            </button>
            <button
              type="button"
              onClick={() => runBatchAction('stop')}
              disabled={selectedNames.size === 0 || batchBusy}
              className="flex h-9 items-center gap-2 rounded-[4px] bg-[#555] px-6 text-[14px] font-bold text-white/45 enabled:text-white enabled:hover:bg-[#5f5f5f] disabled:cursor-not-allowed"
            >
              <span>⏻</span>
              <span>{t('batchClose')}</span>
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setBatchMoreOpen((open) => !open)}
                disabled={selectedNames.size === 0 || batchBusy}
                className="flex h-9 items-center gap-2 rounded-[4px] bg-[#555] px-6 text-[14px] font-bold text-white/45 enabled:text-white enabled:hover:bg-[#5f5f5f] disabled:cursor-not-allowed"
              >
                <span>○</span>
                <span>{t('batchMore')}</span>
              </button>
              {batchMoreOpen && (
                <div className="absolute left-0 top-12 z-30 w-[178px] overflow-hidden rounded-[4px] border border-[#4b4b4b] bg-[#3a3a3a] py-1 text-white shadow-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      setBatchMoreOpen(false)
                      const first = selectedVMs[0]
                      if (first) setSettingsVM(first)
                    }}
                    className="flex h-10 w-full items-center gap-3 px-4 text-left text-sm font-semibold hover:bg-white/10"
                  >
                    <span>▣</span>
                    <span>{t('batchSettings')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBatchMoreOpen(false)
                      setNotice(`${t('moveGroup')}: ${t('defaultGroup')}`)
                    }}
                    className="flex h-10 w-full items-center gap-3 px-4 text-left text-sm font-semibold hover:bg-white/10"
                  >
                    <span>▤</span>
                    <span>{t('moveGroup')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBatchMoreOpen(false)
                      setNotice(t('groupApplied'))
                    }}
                    className="flex h-10 w-full items-center gap-3 px-4 text-left text-sm font-semibold hover:bg-white/10"
                  >
                    <span>↤</span>
                    <span>{t('removeGroup')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => runBatchAction('delete')}
                    className="flex h-10 w-full items-center gap-3 px-4 text-left text-sm font-semibold text-[#ffb0b0] hover:bg-red-500/15"
                  >
                    <span>×</span>
                    <span>{t('delete')}</span>
                  </button>
                </div>
              )}
            </div>
            <div className="hidden flex-1 md:block" />
            <button onClick={exitBatchMode} className="ml-auto flex h-9 items-center gap-2 rounded-[4px] bg-[#12baf7] px-5 text-[14px] font-bold text-[#10212b] hover:bg-[#19c7ff]">
              <span className="text-xl leading-none">×</span>
              <span>{t('cancelBatchOperation')}</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setShowCreate(true)}
              className="flex h-9 items-center gap-2 whitespace-nowrap rounded-[4px] bg-[#12baf7] px-4 text-[14px] font-bold text-[#10212b] shadow-[0_4px_12px_rgba(0,0,0,0.18)] hover:bg-[#19c7ff]"
            >
              <span className="text-[22px] leading-none">+</span>
              <span>{t('createDevice')}</span>
            </button>
            <button
              onClick={() => {
                setBatchMode(true)
                setArrangeOpen(false)
                setSortMenuOpen(false)
              }}
              className="flex h-9 items-center gap-3 whitespace-nowrap rounded-[4px] border-0 bg-[#4a4a4a] px-4 text-[14px] font-bold text-white hover:bg-[#555]"
            >
              <span>▱</span>
              <span>{t('batchActions')}</span>
            </button>
            <div className="relative">
            <button
              onClick={openArrangeFlow}
              className="flex h-9 items-center gap-3 whitespace-nowrap rounded-[4px] border-0 bg-[#4a4a4a] px-4 text-[14px] font-bold text-white hover:bg-[#555]"
            >
              <span>▣</span>
              <span>{t('arrangeWindows')}</span>
            </button>
        {arrangeOpen && (
          <div className="absolute left-0 top-12 z-20 w-[300px] rounded-[4px] border border-[#4b4b4b] bg-[#3a3a3a] p-3 text-white shadow-2xl">
            <div className="mb-2 text-sm font-bold text-[#cfcfcf]">{t('arrangeWindows')}</div>
            {[
              ['grid', t('arrangeGrid'), '▦'],
              ['horizontal', t('arrangeHorizontal'), '▭'],
              ['vertical', t('arrangeVertical'), '▯'],
              ['cascade', t('arrangeCascade'), '▱'],
            ].map(([id, label, icon]) => (
              <button key={id} className="flex h-11 w-full items-center gap-3 rounded-[4px] px-3 text-left text-sm font-semibold hover:bg-white/10">
                <span className="grid w-7 place-items-center text-lg text-[#1d8fff]">{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        )}
            </div>
            <div className="hidden flex-1 md:block" />
          </>
        )}
        {!batchMode && (
          <>
        {searchOpen && (
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t('searchDevices')}
            className="h-9 w-[240px] rounded-[4px] border border-[#555] bg-[#262626] px-4 text-sm font-semibold text-white outline-none focus:border-[#12baf7]"
            autoFocus
          />
        )}
        <button
          onClick={() => {
            setSearchOpen((open) => !open)
            setArrangeOpen(false)
            setSortMenuOpen(false)
            if (searchOpen) setSearchQuery('')
          }}
          className={`grid h-9 w-9 place-items-center rounded-[4px] border-0 text-xl hover:bg-[#555] ${
            searchOpen ? 'bg-[#12baf7] text-[#10212b]' : 'bg-[#2f2f2f] text-white'
          }`}
          title={t('search')}
        >
          ⌕
        </button>
        <div className="relative">
        <button
          onClick={() => {
            setSortMenuOpen((open) => !open)
            setArrangeOpen(false)
          }}
          className="grid h-9 w-9 place-items-center rounded-[4px] border-0 bg-[#2f2f2f] text-xl text-white hover:bg-[#555]"
          title={t('sort')}
        >
          ≡
        </button>
        {sortMenuOpen && (
          <div className="absolute right-0 top-12 z-20 w-[220px] rounded-[4px] border border-[#4b4b4b] bg-[#3a3a3a] p-2 text-white shadow-2xl">
            {[
              ['name', t('sortByName')],
              ['status', t('sortByStatus')],
              ['android', t('sortByAndroid')],
              ['performance', t('sortByPerformance')],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => {
                  setSortMode(id as typeof sortMode)
                  setSortMenuOpen(false)
                }}
                className={`flex h-10 w-full items-center rounded-[4px] px-3 text-left text-sm font-semibold hover:bg-white/10 ${
                  sortMode === id ? 'text-[#12baf7]' : 'text-white'
                }`}
              >
                <span className="mr-3 w-4">{sortMode === id ? '✓' : ''}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        )}
        </div>
        <div className="flex h-9 overflow-hidden rounded-[4px] bg-[#4a4a4a]">
          <button
            onClick={() => setViewMode('detail')}
            className={`grid w-[48px] place-items-center text-lg ${viewMode === 'detail' ? 'bg-[#12baf7] text-[#10212b]' : 'text-white hover:bg-[#555]'}`}
            title={t('detailsView')}
          >
            ▦
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`grid w-[48px] place-items-center text-lg ${viewMode === 'list' ? 'bg-[#12baf7] text-[#10212b]' : 'text-white hover:bg-[#555]'}`}
            title={t('listView')}
          >
            ☰
          </button>
        </div>
          </>
        )}
      </div>

      {notice && (
        <div className="fixed left-1/2 top-[86px] z-50 -translate-x-1/2 rounded-full bg-black/70 px-5 py-2 text-[13px] font-semibold text-white shadow-xl">
          {notice}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45">
          <div className="w-[680px] max-w-[calc(100vw-32px)] overflow-hidden rounded-[4px] border border-[#454545] bg-[#343434] text-white shadow-2xl">
            <div className="flex h-8 items-center border-b border-[#262626] px-3">
              <h3 className="text-[13px] font-semibold text-white">{t('createDevice')}</h3>
              <button type="button" onClick={() => setShowCreate(false)} className="ml-auto grid h-7 w-7 place-items-center rounded-[3px] text-xl text-[#d5d5d5] hover:bg-white/10" disabled={creating}>
                ×
              </button>
            </div>
            <div className="px-[70px] pb-9 pt-7">
              <div className="grid grid-cols-[88px_1fr] items-center gap-x-5 gap-y-4">
                <div className="text-[15px] font-semibold text-white">{t('screenDirection')}：</div>
                <div className="flex gap-4">
                  {[
                    { id: 'landscape' as const, label: t('landscape'), size: '1280 x 720', resolution: '1280x720', dpi: 240 },
                    { id: 'portrait' as const, label: t('portrait'), size: '720 x 1280', resolution: '720x1280', dpi: 320 },
                  ].map((direction) => (
                    <button
                      key={direction.id}
                      type="button"
                      onClick={() => {
                        setScreenDirection(direction.id)
                        setSelectedResolution(direction.resolution)
                        setSelectedDPI(direction.dpi)
                      }}
                      className={`flex h-[58px] items-center gap-3 rounded-[4px] border px-4 text-left ${
                        screenDirection === direction.id
                          ? 'border-[#13baf6] bg-[#444] text-white shadow-[0_0_0_1px_rgba(19,186,246,0.25)]'
                          : 'border-[#4c4c4c] bg-[#474747] text-[#d9d9d9] hover:border-[#777]'
                      }`}
                      disabled={creating}
                    >
                      <span className={`grid place-items-center rounded-[2px] border ${direction.id === 'landscape' ? 'h-4 w-7' : 'h-7 w-4'} ${screenDirection === direction.id ? 'border-white' : 'border-[#9a9a9a]'}`} />
                      <span className="block min-w-[58px] text-center text-sm font-semibold">{direction.label}</span>
                    </button>
                  ))}
                </div>

                <div className="text-[15px] font-semibold text-white">{t('deviceCount')}：</div>
                <div className="flex h-[31px] w-[136px] overflow-hidden rounded-[4px] border border-[#555] bg-[#454545]">
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={deviceQuantity}
                    onChange={(event) => setDeviceQuantity(Math.max(1, Math.min(99, Number(event.target.value) || 1)))}
                    className="min-w-0 flex-1 bg-[#454545] px-3 text-sm font-semibold text-white outline-none"
                    disabled={creating}
                  />
                  <div className="flex w-7 flex-col border-l border-[#555]">
                    <button type="button" onClick={() => setDeviceQuantity((value) => Math.min(99, value + 1))} className="grid flex-1 place-items-center text-[10px] text-[#cfcfcf] hover:bg-white/10" disabled={creating}>⌃</button>
                    <button type="button" onClick={() => setDeviceQuantity((value) => Math.max(1, value - 1))} className="grid flex-1 place-items-center border-t border-[#555] text-[10px] text-[#cfcfcf] hover:bg-white/10" disabled={creating}>⌄</button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAdvancedOpen((open) => !open)}
                className="mx-auto mt-5 flex h-7 items-center gap-1 rounded-[3px] px-2 text-[14px] font-semibold text-[#11baf4] hover:bg-white/8"
                disabled={creating}
              >
                <span>{t('advancedOptions')}</span>
                <span>{advancedOpen ? '⌃' : '⌄'}</span>
              </button>

              {advancedOpen && (
                <div className="mt-3 rounded-[4px] border border-[#444] bg-[#303030] p-4">
                  <label className="mb-3 block">
                    <span className="mb-2 block text-[13px] font-semibold text-[#bdbdbd]">{t('deviceName')}</span>
                    <input
                      type="text"
                      value={newVMName}
                      onChange={(e) => setNewVMName(e.target.value)}
                      placeholder={t('defaultDeviceName')}
                      className="h-9 w-full rounded-[4px] border border-[#4c4c4c] bg-[#262626] px-3 text-sm text-white outline-none placeholder:text-[#777] focus:border-[#12baf7]"
                      disabled={creating}
                    />
                  </label>
                  <div className="mb-3 grid grid-cols-3 gap-2">
                    {[
                      { id: 'high' as const, title: t('extremePerformance'), cpu: 6, ram: '12G', fps: 120 },
                      { id: 'middle' as const, title: t('normalMultiOpen'), cpu: 2, ram: '2G', fps: 60 },
                      { id: 'low' as const, title: t('lowerResource'), cpu: 1, ram: '1G', fps: 30 },
                    ].map((scenario) => (
                      <button
                        key={scenario.id}
                        type="button"
                        onClick={() => {
                          applyPreset(scenario.id)
                          setSelectedCPUs(scenario.cpu)
                          setSelectedRAM(scenario.ram)
                          setSelectedMaxFPS(scenario.fps)
                        }}
                        className={`min-h-[54px] rounded-[4px] border px-3 text-left ${
                          selectedPreset === scenario.id
                            ? 'border-[#12baf7] bg-[#123d4d]'
                            : 'border-[#4c4c4c] bg-[#383838] hover:border-[#777]'
                        }`}
                        disabled={creating}
                      >
                        <span className="block text-sm font-semibold text-white">{scenario.title}</span>
                        <span className="mt-1 block text-xs text-[#aaa]">{scenario.cpu}{t('cores')} · {scenario.ram} · {scenario.fps} FPS · Vulkan</span>
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex h-9 items-center justify-between rounded-[4px] border border-[#454545] bg-[#383838] px-3 text-sm text-[#dcdcdc]">
                      <span>{t('smallDiskMode')}</span>
                      <input type="checkbox" checked={smallDiskMode} onChange={(event) => setSmallDiskMode(event.target.checked)} className="h-4 w-4 accent-[#12baf7]" disabled={creating} />
                    </label>
                    <label className="flex h-9 items-center justify-between rounded-[4px] border border-[#454545] bg-[#383838] px-3 text-sm text-[#dcdcdc]">
                      <span>{t('rootPermission')}</span>
                      <input type="checkbox" checked={rootEnabled} onChange={(event) => setRootEnabled(event.target.checked)} className="h-4 w-4 accent-[#12baf7]" disabled={creating} />
                    </label>
                  </div>
                </div>
              )}

              {creating && (
                <div className="mt-3 rounded-[4px] bg-[#123d4d] p-3 text-[#8be3ff]">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-[#12baf7]" />
                    <span className="text-sm">{t('creating')}</span>
                  </div>
                </div>
              )}
              <div className="mt-5 flex justify-center">
              <button
                onClick={handleCreate}
                className="h-[32px] min-w-[132px] rounded-[4px] bg-[#12baf7] px-5 text-sm font-bold text-[#10212b] hover:bg-[#19c7ff] disabled:opacity-50"
                disabled={creating}
              >
                {creating ? t('creating') : t('create')}
              </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {arrangeNoticeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45">
          <div className="w-[320px] overflow-hidden rounded-[4px] border border-[#454545] bg-[#2f2f2f] text-white shadow-2xl">
            <div className="bg-[#3a3a3a] px-5 pb-5 pt-6">
              <div className="text-[20px] font-semibold">{t('noArrangeWindow')}</div>
              <div className="mt-3 text-[14px] text-[#d6d6d6]">{t('arrangeRequiresRunningDevice')}</div>
            </div>
            <div className="flex justify-end bg-[#282828] px-6 py-5">
              <button
                type="button"
                onClick={() => setArrangeNoticeOpen(false)}
                className="h-8 min-w-[132px] rounded-[4px] bg-[#12baf7] px-6 text-sm font-bold text-[#10212b] hover:bg-[#19c7ff]"
              >
                {t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {vms.length === 0 ? (
        <div className="mx-6 min-h-[420px] rounded-[2px] bg-[#2f2f2f] py-24 text-center">
          <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-[8px] bg-[#3a3a3a] text-4xl text-[#12baf7]">▣</div>
          <h3 className="mb-2 text-xl font-bold text-white">{t('noDevicesYet')}</h3>
          <p className="mb-6 font-medium text-[#a9a9a9]">{t('createFirstDevice')}</p>
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-[4px] bg-[#12baf7] px-6 py-3 font-bold text-[#10212b] hover:bg-[#19c7ff]"
          >
            {t('createDevice')}
          </button>
        </div>
      ) : visibleVMs.length === 0 ? (
        <div className="mx-6 min-h-[420px] rounded-[2px] bg-[#2f2f2f] py-24 text-center">
          <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-[8px] bg-[#3a3a3a] text-4xl text-[#12baf7]">⌕</div>
          <h3 className="mb-2 text-xl font-bold text-white">{t('noSearchResults')}</h3>
          <p className="mb-6 font-medium text-[#a9a9a9]">{t('tryAnotherKeyword')}</p>
          <button
            onClick={() => setSearchQuery('')}
            className="rounded-[4px] bg-[#12baf7] px-6 py-3 font-bold text-[#10212b] hover:bg-[#19c7ff]"
          >
            {t('clearSearch')}
          </button>
        </div>
      ) : (
        <div className="mx-6 border-t border-[#383838]">
          {visibleVMs.map((vm) => (
            <VMCard
              key={vm.name}
              vm={vm}
              onStart={handleStart}
              onOpen={onOpen}
              onSettings={setSettingsVM}
              onRefresh={onRefresh}
              isStarting={startingNames.has(vm.name)}
              viewMode={viewMode}
              batchMode={batchMode}
              selected={selectedNames.has(vm.name)}
              onToggleSelected={toggleSelected}
            />
          ))}
        </div>
      )}

      {settingsVM && (
        <DeviceSettingsDialog
          vm={settingsVM}
          onClose={() => setSettingsVM(null)}
          onSaved={onRefresh}
        />
      )}
    </div>
  )
}
