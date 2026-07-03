import { useI18n } from '../lib/i18n'
import type { VMInfo } from '../lib/types'

interface SidebarProps {
	open: boolean
	activeView: string
	onViewChange: (view: string) => void
	vms: VMInfo[]
	selectedVM?: VMInfo
	onSelectVM: (name: string) => void
}

const NAV_ITEMS = [
	{ id: 'display', labelKey: 'display', icon: '▣' },
	{ id: 'vms', labelKey: 'multiInstance', icon: '▦' },
	{ id: 'files', labelKey: 'fileManager', icon: '□' },
	{ id: 'shell', labelKey: 'shell', icon: '>' },
	{ id: 'logs', labelKey: 'logs', icon: '≡' },
	{ id: 'keymap', labelKey: 'keyMapping', icon: '⌘' },
	{ id: 'settings', labelKey: 'settings', icon: '⚙' },
]

export function Sidebar({ open, activeView, onViewChange, vms, selectedVM, onSelectVM }: SidebarProps) {
	const { t } = useI18n()

	if (!open) return null

	return (
		<aside className="w-56 bg-gray-800 border-r border-gray-700 flex flex-col">
			<div className="h-14 flex items-center px-4 border-b border-gray-700">
				<span className="font-bold text-lg">AndroidSim233</span>
			</div>

			<nav className="flex-1 p-2 space-y-1">
				{NAV_ITEMS.map((item) => (
					<button
						key={item.id}
						onClick={() => onViewChange(item.id)}
						className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
							activeView === item.id
								? 'bg-blue-600 text-white'
								: 'text-gray-400 hover:bg-gray-700 hover:text-white'
						}`}
					>
						<span>{item.icon}</span>
						<span>{t(item.labelKey)}</span>
					</button>
				))}
			</nav>

			<div className="p-2 border-t border-gray-700">
				<div className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
					{t('devices')}
				</div>
				<div className="space-y-1 max-h-48 overflow-auto">
					{vms.length === 0 ? (
						<div className="px-2 py-2 text-xs text-gray-500">{t('noDevices')}</div>
					) : (
						vms.map((vm) => (
							<button
								key={vm.name}
								onClick={() => onSelectVM(vm.name)}
								className={`w-full rounded px-2 py-2 text-left text-sm ${
									selectedVM?.name === vm.name
										? 'bg-gray-700 text-white'
										: 'text-gray-400 hover:bg-gray-700'
								}`}
							>
								<div className="truncate">{vm.name}</div>
								<div className="text-xs text-gray-500">{vm.status ?? 'stopped'}</div>
							</button>
						))
					)}
				</div>
			</div>

			<div className="p-4 border-t border-gray-700 text-xs text-gray-500">
				v0.1.0
			</div>
		</aside>
	)
}
