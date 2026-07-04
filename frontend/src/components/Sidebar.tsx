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
	{ id: 'vms', labelKey: 'devices', icon: '▣' },
	{ id: 'display', labelKey: 'display', icon: '▤' },
	{ id: 'files', labelKey: 'fileManager', icon: '□' },
	{ id: 'shell', labelKey: 'shell', icon: '>' },
	{ id: 'logs', labelKey: 'logs', icon: '≡' },
	{ id: 'keymap', labelKey: 'keyMapping', icon: '⌘' },
	{ id: 'settings', labelKey: 'settings', icon: '⚙' },
]

export function Sidebar({
	open,
	activeView,
	onViewChange,
	vms: _vms,
	selectedVM: _selectedVM,
	onSelectVM: _onSelectVM,
}: SidebarProps) {
	const { t } = useI18n()

	if (!open) return null

	return (
		<aside className="flex w-[110px] flex-col border-r border-black/40 bg-[#202020]">
			<nav className="flex-1 space-y-5 px-3 pt-12">
				{NAV_ITEMS.map((item) => (
					<button
						key={item.id}
						onClick={() => onViewChange(item.id)}
						className={`flex h-[78px] w-full flex-col items-center justify-center gap-2 rounded-md text-base transition-colors ${
							activeView === item.id
								? 'bg-white/15 text-white'
								: 'text-gray-300 hover:bg-white/10 hover:text-white'
						}`}
					>
						<span className="text-3xl leading-none">{item.icon}</span>
						<span>{t(item.labelKey)}</span>
					</button>
				))}
			</nav>

			<div className="border-t border-white/10 p-4 text-center text-xs text-gray-500">
				v0.1.0
			</div>
		</aside>
	)
}
