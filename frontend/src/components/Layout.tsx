import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

interface LayoutProps {
	children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
	const [sidebarOpen, setSidebarOpen] = useState(true)

	return (
		<div className="flex h-screen bg-gray-900 text-white">
			{/* Sidebar */}
			<Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

			{/* Main content */}
			<div className="flex-1 flex flex-col overflow-hidden">
				<Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
				<main className="flex-1 overflow-auto">{children}</main>
			</div>
		</div>
	)
}
