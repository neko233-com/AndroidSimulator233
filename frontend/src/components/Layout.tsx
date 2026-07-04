import { useState } from 'react'
import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import type { VMInfo } from '../lib/types'

interface LayoutProps {
	children: ReactNode
	activeView: string
	onViewChange: (view: string) => void
	selectedVM?: VMInfo
	vms: VMInfo[]
	onSelectVM: (name: string) => void
}

export function Layout({
	children,
	activeView,
	onViewChange,
	selectedVM,
	vms,
	onSelectVM,
}: LayoutProps) {
	const [sidebarOpen, setSidebarOpen] = useState(true)

	return (
		<div className="flex h-screen flex-col overflow-hidden bg-[#2b2b2b] text-white">
			<Header
				onMenuClick={() => setSidebarOpen(!sidebarOpen)}
				selectedVM={selectedVM}
				vms={vms}
			/>
			<div className="flex min-h-0 flex-1 overflow-hidden">
				<Sidebar
					open={sidebarOpen}
					activeView={activeView}
					onViewChange={onViewChange}
					vms={vms}
					selectedVM={selectedVM}
					onSelectVM={onSelectVM}
				/>
				<main className="min-h-0 flex-1 overflow-auto bg-[#2f2f2f]">{children}</main>
			</div>
		</div>
	)
}
