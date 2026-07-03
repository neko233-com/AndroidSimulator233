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
import { GoBridge } from './lib/types'

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
			alert(t('stopFailed') + err)
		}
	}

	const resetVM = async () => {
		if (!selectedVM) return
		try {
			await GoBridge.ResetVM(selectedVM.name)
			await refreshVMs()
		} catch (err) {
			alert(t('resetFailed') + err)
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

	return (
		<div className="p-6">
			<h2 className="mb-6 text-2xl font-bold">{t('deviceSettings')}</h2>
			<div className="max-w-2xl rounded-lg bg-gray-800 p-4">
				<div className="grid grid-cols-2 gap-4 text-sm">
					<div className="text-gray-400">{t('name')}</div>
					<div>{vm.name}</div>
					<div className="text-gray-400">{t('android')}</div>
					<div>{vm.android}</div>
					<div className="text-gray-400">{t('cpu')}</div>
					<div>{vm.cpus} {t('cores')}</div>
					<div className="text-gray-400">{t('ram')}</div>
					<div>{vm.ram}</div>
					<div className="text-gray-400">{t('resolution')}</div>
					<div>{vm.resolution ?? '1280x720'}</div>
					<div className="text-gray-400">{t('dpi')}</div>
					<div>{vm.dpi ?? 240}</div>
					<div className="text-gray-400">{t('performance')}</div>
					<div>{vm.performance ?? 'middle'}</div>
					<div className="text-gray-400">{t('renderer')}</div>
					<div>{vm.renderer ?? 'vulkan'}</div>
					<div className="text-gray-400">{t('frameRate')}</div>
					<div>{vm.maxFps ?? 60} FPS</div>
					<div className="text-gray-400">{t('rootPermission')}</div>
					<div>{vm.root ? t('enabled') : t('disabled')}</div>
					<div className="text-gray-400">{t('phoneModel')}</div>
					<div>{[vm.phoneBrand, vm.phoneModel].filter(Boolean).join(' ') || 'Xiaomi 14 Ultra'}</div>
					<div className="text-gray-400">{t('adbEndpoint')}</div>
					<div>{vm.adbPort ? `127.0.0.1:${vm.adbPort}` : t('notAssigned')}</div>
					<div className="text-gray-400">{t('displayEndpoint')}</div>
					<div>{vm.vncPort ? `ws://127.0.0.1:${vm.vncPort}` : t('notAssigned')}</div>
				</div>
			</div>
		</div>
	)
}

export default App
