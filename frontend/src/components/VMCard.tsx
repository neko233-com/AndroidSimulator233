import { VMInfo } from '../lib/types'

interface VMCardProps {
	vm: VMInfo
	onDelete: (name: string) => void
}

export function VMCard({ vm, onDelete }: VMCardProps) {
	const statusColors: Record<string, string> = {
		running: 'bg-green-500',
		stopped: 'bg-gray-500',
		starting: 'bg-yellow-500',
	}

	return (
		<div className="bg-gray-800 rounded-lg border border-gray-700 p-4 hover:border-gray-600 transition-colors">
			{/* Thumbnail placeholder */}
			<div className="aspect-video bg-gray-700 rounded mb-4 flex items-center justify-center">
				<span className="text-4xl">📱</span>
			</div>

			{/* VM info */}
			<div className="flex items-center gap-2 mb-2">
				<h3 className="font-semibold">{vm.name}</h3>
				<span
					className={`w-2 h-2 rounded-full ${statusColors[vm.status || 'stopped']}`}
				/>
			</div>

			<div className="text-sm text-gray-400 space-y-1">
				<p>{vm.android}</p>
				<p>{vm.cpus} CPUs · {vm.ram} RAM</p>
			</div>

			{/* Actions */}
			<div className="flex gap-2 mt-4">
				<button className="flex-1 px-3 py-2 bg-blue-600 rounded hover:bg-blue-500 text-sm">
					Start
				</button>
				<button
					onClick={() => onDelete(vm.name)}
					className="px-3 py-2 bg-red-600 rounded hover:bg-red-500 text-sm"
				>
					Delete
				</button>
			</div>
		</div>
	)
}
