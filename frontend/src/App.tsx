import { useEffect, useMemo, useState } from 'react'
import { Display } from './components/Display'
import { FileManager } from './components/FileManager'
import { KeyMapping } from './components/KeyMapping'
import { Layout } from './components/Layout'
import { LogViewer } from './components/LogViewer'
import { Terminal } from './components/Terminal'
import { VMList } from './components/VMList'
import { I18nProvider, useI18n } from './lib/i18n'
import type { VMInfo } from './lib/types'
import { GoBridge, formatNativeError } from './lib/types'

type View = 'display' | 'vms' | 'files' | 'shell' | 'logs' | 'keymap' | 'settings'

function App() {
	return (
		<I18nProvider>
			<AppShell />
		</I18nProvider>
	)
}

function AppShell() {
	const { t } = useI18n()
	const [activeView, setActiveView] = useState<View>('vms')
	const [vms, setVMs] = useState<VMInfo[]>([])
	const [selectedVMName, setSelectedVMName] = useState('')
	const [loading, setLoading] = useState(true)

	const selectedVM = useMemo(
		() => vms.find((vm) => vm.name === selectedVMName) ?? vms[0],
		[vms, selectedVMName]
	)
	const adbDeviceId = selectedVM?.adbPort ? `127.0.0.1:${selectedVM.adbPort}` : selectedVM?.name ?? ''

	const refreshVMs = async () => {
		try {
			const result = await GoBridge.ListVMs()
			setVMs(result || [])
			if (!selectedVMName && result?.length) {
				setSelectedVMName(result[0].name)
			}
		} catch (err) {
			console.error('Failed to load VMs:', err)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		refreshVMs()
		const interval = window.setInterval(refreshVMs, 3000)
		return () => window.clearInterval(interval)
	}, [])

	const openVM = (name: string) => {
		setSelectedVMName(name)
		setActiveView('display')
	}

	const stopVM = async () => {
		if (!selectedVM) return
		try {
			await GoBridge.StopVM(selectedVM.name)
			await refreshVMs()
		} catch (err) {
			alert(t('stopFailed') + formatNativeError(err))
		}
	}

	const resetVM = async () => {
		if (!selectedVM) return
		try {
			await GoBridge.ResetVM(selectedVM.name)
			await refreshVMs()
		} catch (err) {
			alert(t('resetFailed') + formatNativeError(err))
		}
	}

	const renderView = () => {
		if (activeView === 'vms') {
			return <VMList vms={vms} loading={loading} onRefresh={refreshVMs} onOpen={openVM} />
		}

		if (!selectedVM) {
			return (
				<div className="flex h-full items-center justify-center">
					<div className="text-center">
						<div className="text-lg font-semibold">{t('noDeviceSelected')}</div>
						<button
							onClick={() => setActiveView('vms')}
							className="mt-4 rounded bg-blue-600 px-4 py-2 hover:bg-blue-500"
						>
							{t('openManager')}
						</button>
					</div>
				</div>
			)
		}

		switch (activeView) {
			case 'display':
				return (
					<div className="flex h-full flex-col">
						<div className="flex items-center gap-2 border-b border-gray-700 bg-gray-800 px-3 py-2">
							<div className="mr-auto text-sm text-gray-400">
								{selectedVM.status ?? 'stopped'} · {t('adb')} {selectedVM.adbPort ?? '-'} · {t('vnc')} {selectedVM.vncPort ?? '-'}
							</div>
							<button onClick={refreshVMs} className="rounded bg-gray-700 px-3 py-1 text-sm hover:bg-gray-600">
								{t('refresh')}
							</button>
							<button onClick={resetVM} className="rounded bg-gray-700 px-3 py-1 text-sm hover:bg-gray-600">
								{t('reset')}
							</button>
							<button onClick={stopVM} className="rounded bg-red-700 px-3 py-1 text-sm hover:bg-red-600">
								{t('stop')}
							</button>
						</div>
						<Display vm={selectedVM} />
					</div>
				)
			case 'files':
				return <FileManager deviceId={adbDeviceId} />
			case 'shell':
				return <Terminal deviceId={adbDeviceId} />
			case 'logs':
				return <LogViewer deviceId={adbDeviceId} />
			case 'keymap':
				return <KeyMapping onSave={(config) => alert(t('savedKeymapProfile') + config.name)} />
			case 'settings':
				return <SettingsPanel vm={selectedVM} />
		}
	}

	return (
		<Layout
			activeView={activeView}
			onViewChange={(view) => setActiveView(view as View)}
			selectedVM={selectedVM}
			vms={vms}
			onSelectVM={openVM}
		>
			{renderView()}
		</Layout>
	)
}

function SettingsPanel({ vm }: { vm: VMInfo }) {
	const { t } = useI18n()
	const settingsNav = [
		t('performance'),
		t('display'),
		t('audio'),
		t('network'),
		t('phoneModel'),
		t('developerOptions'),
		t('other'),
	]
	const rows = [
		{ icon: '▣', label: t('renderer'), value: (vm.renderer ?? 'vulkan') === 'directx' ? 'DirectX' : 'Vulkan' },
		{ icon: '▤', label: t('performance'), value: vm.performance ?? 'middle' },
		{ icon: '▥', label: t('memory'), value: `${vm.cpus} ${t('cores')} · ${vm.ram}` },
		{ icon: '▧', label: t('resolution'), value: `${vm.resolution ?? '1280x720'} · ${vm.dpi ?? 240} DPI` },
		{ icon: '▦', label: t('frameRate'), value: `${vm.maxFps ?? 60} FPS` },
		{ icon: '□', label: t('rootPermission'), value: vm.root ? t('enabled') : t('disabled') },
		{ icon: '◇', label: t('phoneModel'), value: [vm.phoneBrand, vm.phoneModel].filter(Boolean).join(' ') || 'Xiaomi 14 Ultra' },
	]

	return (
		<div className="flex min-h-full bg-[#202020]">
			<div className="w-[372px] px-6 py-8">
				<div className="mb-6 text-xl">{t('deviceSettings')}</div>
				<div className="space-y-3">
					{settingsNav.map((item, index) => (
						<button
							key={item}
							className={`flex h-[72px] w-full items-center gap-4 rounded-md px-8 text-left text-xl ${
								index === 0 ? 'border-l-4 border-sky-400 bg-white/10' : 'hover:bg-white/5'
							}`}
						>
							<span className="text-2xl">{index === 0 ? '▣' : '□'}</span>
							<span>{item}</span>
						</button>
					))}
				</div>
			</div>
			<div className="flex-1 px-9 py-20">
				<h2 className="mb-10 text-[34px] font-medium">{t('performance')}</h2>
				<div className="max-w-5xl space-y-2">
					{rows.map((row) => (
						<div key={row.label} className="flex min-h-[102px] items-center rounded-md bg-white/10 px-8">
							<span className="mr-7 text-3xl">{row.icon}</span>
							<div className="text-xl">{row.label}</div>
							<div className="ml-auto text-right text-xl text-white">{row.value}</div>
							<span className="ml-8 text-2xl text-gray-300">⌄</span>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}

export default App
