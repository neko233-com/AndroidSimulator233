import { useState, useEffect } from 'react'
import { VMCard } from './VMCard'

interface VMInfo {
	name: string
	cpus: number
	ram: string
	android: string
	status?: string
}

export function VMList() {
	const [vms, setVMs] = useState<VMInfo[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		loadVMs()
	}, [])

	const loadVMs = async () => {
		try {
			const result = await (window as any).ListVMs()
			setVMs(result || [])
		} catch (err) {
			console.error('Failed to load VMs:', err)
		} finally {
			setLoading(false)
		}
	}

	const handleCreate = async () => {
		const name = prompt('VM Name:')
		if (!name) return

		const android = prompt('Android version (android-9, android-12, android-14):', 'android-12')
		if (!android) return

		try {
			await (window as any).CreateVM(name, android)
			loadVMs()
		} catch (err) {
			alert('Failed to create VM: ' + err)
		}
	}

	const handleDelete = async (name: string) => {
		if (!confirm(`Delete VM "${name}"?`)) return

		try {
			await (window as any).DeleteVM(name)
			loadVMs()
		} catch (err) {
			alert('Failed to delete VM: ' + err)
		}
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="text-gray-400">Loading VMs...</div>
			</div>
		)
	}

	return (
		<div className="p-6">
			<div className="flex items-center justify-between mb-6">
				<h2 className="text-2xl font-bold">Virtual Machines</h2>
				<button
					onClick={handleCreate}
					className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500"
				>
					+ Create VM
				</button>
			</div>

			{vms.length === 0 ? (
				<div className="text-center py-12">
					<p className="text-gray-400 mb-4">No virtual machines yet</p>
					<button
						onClick={handleCreate}
						className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-500"
					>
						Create Your First VM
					</button>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{vms.map((vm) => (
						<VMCard key={vm.name} vm={vm} onDelete={handleDelete} />
					))}
				</div>
			)}
		</div>
	)
}
