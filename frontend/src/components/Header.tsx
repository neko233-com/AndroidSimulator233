interface HeaderProps {
	onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
	return (
		<header className="h-14 bg-gray-800 border-b border-gray-700 flex items-center px-4">
			<button
				onClick={onMenuClick}
				className="p-2 hover:bg-gray-700 rounded-lg mr-4"
			>
				☰
			</button>
			<h1 className="text-lg font-semibold">AndroidSimulator233</h1>
			<div className="flex-1" />
			<div className="flex items-center gap-2">
				<span className="text-sm text-gray-400">CPU: 45%</span>
				<span className="text-sm text-gray-400">RAM: 2.1GB</span>
			</div>
		</header>
	)
}
