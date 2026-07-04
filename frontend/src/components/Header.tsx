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
		<header className="flex h-[72px] items-center border-b border-black/40 bg-[#1f1f1f] px-8">
			<div className="mr-7 grid h-10 w-10 place-items-center rounded-lg bg-sky-500 text-2xl font-black text-white">
				A
			</div>
			<h1 className="text-2xl font-medium">AndroidSimulator233</h1>
			<button
				onClick={onMenuClick}
				className="ml-auto grid h-10 w-10 place-items-center rounded-md text-2xl hover:bg-white/10"
				title={t('multiInstance')}
			>
				☰
			</button>
			{selectedVM && (
				<div className="ml-4 hidden text-sm text-gray-400 xl:block">
					{selectedVM.name} · {selectedVM.android}
				</div>
			)}
			<div className="ml-5 h-8 w-px bg-white/10" />
			<div className="ml-5 flex items-center gap-4">
				<span className="text-sm text-gray-400">{t('devices')}: {vms.length}</span>
				<span className="text-sm text-gray-400">{t('running')}: {runningCount}</span>
				<select
					value={language}
					onChange={(event) => setLanguage(event.target.value === 'zh' ? 'zh' : 'en')}
					className="rounded bg-white/10 px-3 py-2 text-sm text-white"
					aria-label={t('language')}
				>
					<option value="zh">{t('chinese')}</option>
					<option value="en">{t('english')}</option>
				</select>
			</div>
		</header>
	)
}
