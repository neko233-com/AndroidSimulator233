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
		<div className="flex h-screen bg-gray-900 text-white">
			<Sidebar
				open={sidebarOpen}
				activeView={activeView}
				onViewChange={onViewChange}
				vms={vms}
				selectedVM={selectedVM}
				onSelectVM={onSelectVM}
			/>

			<div className="flex-1 flex flex-col overflow-hidden">
				<Header
					onMenuClick={() => setSidebarOpen(!sidebarOpen)}
					selectedVM={selectedVM}
					vms={vms}
				/>
				<main className="flex-1 overflow-auto">{children}</main>
			</div>
		</div>
	)
}
