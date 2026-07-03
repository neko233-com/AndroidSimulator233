import { useState } from 'react'

interface SidebarProps {
	open: boolean
	onToggle: () => void
}

const NAV_ITEMS = [
	{ id: 'vms', label: 'Virtual Machines', icon: '💻' },
	{ id: 'files', label: 'File Manager', icon: '📁' },
	{ id: 'shell', label: 'Shell', icon: ' terminal' },
	{ id: 'logs', label: 'Logs', icon: '📋' },
	{ id: 'keymap', label: 'Key Mapping', icon: '🎮' },
	{ id: 'settings', label: 'Settings', icon: '⚙️' },
]

export function Sidebar({ open, onToggle: _onToggle }: SidebarProps) {
	const [active, setActive] = useState('vms')

	if (!open) return null

	return (
		<aside className="w-56 bg-gray-800 border-r border-gray-700 flex flex-col">
			{/* Logo */}
			<div className="h-14 flex items-center px-4 border-b border-gray-700">
				<span className="font-bold text-lg">AndroidSim233</span>
			</div>

			{/* Navigation */}
			<nav className="flex-1 p-2 space-y-1">
				{NAV_ITEMS.map((item) => (
					<button
						key={item.id}
						onClick={() => setActive(item.id)}
						className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
							active === item.id
								? 'bg-blue-600 text-white'
								: 'text-gray-400 hover:bg-gray-700 hover:text-white'
						}`}
					>
						<span>{item.icon}</span>
						<span>{item.label}</span>
					</button>
				))}
			</nav>

			{/* Footer */}
			<div className="p-4 border-t border-gray-700 text-xs text-gray-500">
				v0.1.0
			</div>
		</aside>
	)
}
