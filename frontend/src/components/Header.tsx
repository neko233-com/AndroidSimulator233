import { useI18n } from '../lib/i18n'
import type { VMInfo } from '../lib/types'

interface HeaderProps {
	onMenuClick: () => void
	selectedVM?: VMInfo
	vms: VMInfo[]
}

export function Header({ onMenuClick, selectedVM, vms }: HeaderProps) {
	const { language, setLanguage, t } = useI18n()
	const runningCount = vms.filter((vm) => vm.status === 'running' || vm.status === 'starting').length

	return (
		<header className="h-14 bg-gray-800 border-b border-gray-700 flex items-center px-4">
			<button
				onClick={onMenuClick}
				className="p-2 hover:bg-gray-700 rounded-lg mr-4"
			>
				☰
			</button>
			<h1 className="text-lg font-semibold">AndroidSimulator233</h1>
			{selectedVM && (
				<div className="ml-4 text-sm text-gray-400">
					{selectedVM.name} · {selectedVM.android}
				</div>
			)}
			<div className="flex-1" />
			<div className="flex items-center gap-3">
				<span className="text-sm text-gray-400">{t('devices')}: {vms.length}</span>
				<span className="text-sm text-gray-400">{t('running')}: {runningCount}</span>
				<select
					value={language}
					onChange={(event) => setLanguage(event.target.value === 'zh' ? 'zh' : 'en')}
					className="rounded bg-gray-700 px-2 py-1 text-sm text-white"
					aria-label={t('language')}
				>
					<option value="zh">{t('chinese')}</option>
					<option value="en">{t('english')}</option>
				</select>
			</div>
		</header>
	)
}
