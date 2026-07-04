import { useI18n } from '../lib/i18n'
import type { VMInfo } from '../lib/types'

interface HeaderProps {
	onMenuClick: () => void
	selectedVM?: VMInfo
	vms: VMInfo[]
}

export function Header({ onMenuClick, selectedVM }: HeaderProps) {
	const { t } = useI18n()

	return (
		<header className="flex h-[48px] flex-none items-center border-b border-[#101010] bg-[#1f1f1f] px-3 text-white">
			<div className="relative mr-3 h-[30px] w-[30px] overflow-hidden rounded-[7px] bg-[#18baff] shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
				<span className="absolute left-[7px] top-[10px] h-[12px] w-[7px] rotate-[-26deg] rounded-full bg-white" />
				<span className="absolute left-[13px] top-[8px] h-[14px] w-[7px] rotate-[25deg] rounded-full bg-white" />
				<span className="absolute right-[6px] top-[13px] h-[5px] w-[5px] rounded-full bg-white" />
			</div>
			<div className="min-w-0">
				<h1 className="truncate text-[16px] font-semibold text-white">{t('appBrand')}</h1>
			</div>
			<div className="ml-auto flex min-w-0 items-center gap-1">
				{selectedVM && (
					<div className="mr-2 hidden max-w-[220px] truncate rounded-[4px] bg-white/8 px-3 py-1.5 text-xs font-medium text-[#cfcfcf] xl:block">
						{selectedVM.name} · {selectedVM.android}
					</div>
				)}
				<button
					className="grid h-9 w-9 place-items-center rounded-[4px] text-[#c9c9c9] hover:bg-white/10"
					title={t('accountCenter')}
				>
					<span className="grid h-[22px] w-[22px] place-items-center rounded-full border border-[#7c7c7c] text-[13px]">●</span>
				</button>
				<button
					onClick={onMenuClick}
					className="grid h-9 w-9 flex-none place-items-center rounded-[4px] text-xl text-[#c9c9c9] hover:bg-white/10"
					title={t('multiInstance')}
				>
					☰
				</button>
				<div className="mx-1 h-7 w-px bg-white/10" />
				<button className="grid h-9 w-9 place-items-center rounded-[4px] text-[#c9c9c9] hover:bg-white/10" title={t('minimize')}>−</button>
				<button className="grid h-9 w-9 place-items-center rounded-[4px] text-[#c9c9c9] hover:bg-white/10" title={t('close')}>×</button>
			</div>
		</header>
	)
}
