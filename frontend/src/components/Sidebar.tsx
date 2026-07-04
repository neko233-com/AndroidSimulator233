import { useState } from 'react'
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
	{ id: 'display', labelKey: 'remoteControlShort', icon: '▭' },
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
	const [debugOpen, setDebugOpen] = useState(false)
	const debugItems = [
		{ id: 'files', label: t('fileTransfer'), icon: '↔' },
		{ id: 'shell', label: t('adb'), icon: 'ADB' },
		{ id: 'logs', label: t('appLogs'), icon: '▤' },
		{ id: 'settings', label: t('deviceSettings'), icon: '▣' },
	]

	if (!open) return null

	return (
		<aside className="flex w-[74px] flex-none flex-col border-r border-[#111] bg-[#202020]">
			<nav className="flex-1 space-y-3 px-2 pt-8">
				{NAV_ITEMS.map((item) => (
					<button
						key={item.id}
						onClick={() => onViewChange(item.id)}
						className={`relative flex h-[72px] w-full flex-col items-center justify-center gap-2 rounded-[4px] text-xs font-semibold transition-all ${
							activeView === item.id
								? 'bg-[#3a3a3a] text-white'
								: 'text-[#d7d7d7] hover:bg-[#303030] hover:text-white'
						}`}
					>
						<span className="text-[24px] leading-none text-white">{item.icon}</span>
						<span>{t(item.labelKey)}</span>
					</button>
				))}
			</nav>

			<div className="relative p-3 text-center">
				{debugOpen && (
					<div className="absolute bottom-[76px] left-[70px] z-30 w-[188px] rounded-[4px] border border-[#464646] bg-[#303030] p-2 text-left shadow-2xl">
						<div className="px-3 py-2 text-xs font-semibold text-[#8f8f8f]">{t('developerDebug')}</div>
						{debugItems.map((item) => (
							<button
								key={item.id}
								onClick={() => {
									onViewChange(item.id)
									setDebugOpen(false)
								}}
								className={`flex h-10 w-full items-center gap-3 rounded-[4px] px-3 text-sm font-semibold ${
									activeView === item.id ? 'bg-[#123d4d] text-[#12baf7]' : 'text-white hover:bg-white/10'
								}`}
							>
								<span className="grid w-8 place-items-center text-xs font-bold">{item.icon}</span>
								<span className="truncate">{item.label}</span>
							</button>
						))}
					</div>
				)}
				<button
					onClick={() => setDebugOpen((open) => !open)}
					className={`mb-2 flex h-[54px] w-full flex-col items-center justify-center gap-1 rounded-[4px] text-xs font-semibold ${
						['files', 'shell', 'logs', 'settings'].includes(activeView)
							? 'bg-[#3a3a3a] text-white'
							: 'text-[#d7d7d7] hover:bg-[#303030]'
					}`}
				>
					<span className="text-xl">▥</span>
					<span>{t('debug')}</span>
				</button>
				<button
					onClick={() => onViewChange('logs')}
					className="flex h-[54px] w-full flex-col items-center justify-center gap-1 rounded-[4px] text-xs font-semibold text-[#d7d7d7] hover:bg-[#303030]"
				>
					<span className="text-xl">▢</span>
					<span>{t('feedback')}</span>
				</button>
			</div>
		</aside>
	)
}
