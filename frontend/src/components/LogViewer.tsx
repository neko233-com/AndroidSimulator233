import { useState, useEffect, useRef } from 'react'
import type { LogEntry } from '../lib/types'

interface LogViewerProps {
	deviceId: string
}

const LEVEL_COLORS: Record<string, string> = {
	V: 'text-gray-400',
	D: 'text-blue-400',
	I: 'text-green-400',
	W: 'text-yellow-400',
	E: 'text-red-400',
	F: 'text-red-600',
}

export function LogViewer({ deviceId }: LogViewerProps) {
	const [logs, setLogs] = useState<LogEntry[]>([])
	const [filter, setFilter] = useState('')
	const [level, setLevel] = useState('V')
	const [autoScroll, setAutoScroll] = useState(true)
	const [search, setSearch] = useState('')
	const bottomRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		loadLogs()
		const interval = setInterval(loadLogs, 1000)
		return () => clearInterval(interval)
	}, [filter, level])

	useEffect(() => {
		if (autoScroll) {
			bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
		}
	}, [logs, autoScroll])

	const loadLogs = async () => {
		try {
			const filterStr = filter ? `${filter}:* ${level}:*` : `*:${level}`
			const result = await window.GetLogs(deviceId, filterStr)
			setLogs(result || [])
		} catch (err) {
			console.error('Failed to load logs:', err)
		}
	}

	const filteredLogs = search
		? logs.filter(
				(log) =>
					log.message.toLowerCase().includes(search.toLowerCase()) ||
					log.tag.toLowerCase().includes(search.toLowerCase())
		  )
		: logs

	const handleExport = () => {
		const text = filteredLogs
			.map((log) => `[${log.level}] ${log.tag} (PID:${log.pid}): ${log.message}`)
			.join('\n')
		const blob = new Blob([text], { type: 'text/plain' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `logcat_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`
		a.click()
		URL.revokeObjectURL(url)
	}

	return (
		<div className="flex flex-col h-full bg-gray-900">
			{/* Filters */}
			<div className="flex items-center gap-2 p-2 bg-gray-800 border-b border-gray-700">
				<input
					type="text"
					value={filter}
					onChange={(e) => setFilter(e.target.value)}
					placeholder="Filter by tag..."
					className="px-2 py-1 text-sm bg-gray-700 rounded text-white w-40"
				/>
				<select
					value={level}
					onChange={(e) => setLevel(e.target.value)}
					className="px-2 py-1 text-sm bg-gray-700 rounded text-white"
				>
					<option value="V">Verbose</option>
					<option value="D">Debug</option>
					<option value="I">Info</option>
					<option value="W">Warn</option>
					<option value="E">Error</option>
					<option value="F">Fatal</option>
				</select>
				<input
					type="text"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Search logs..."
					className="px-2 py-1 text-sm bg-gray-700 rounded text-white flex-1"
				/>
				<label className="flex items-center gap-1 text-sm text-gray-400">
					<input
						type="checkbox"
						checked={autoScroll}
						onChange={(e) => setAutoScroll(e.target.checked)}
					/>
					Auto-scroll
				</label>
				<button
					onClick={handleExport}
					className="px-2 py-1 text-sm bg-gray-600 rounded hover:bg-gray-500"
				>
					Export
				</button>
				<button
					onClick={loadLogs}
					className="px-2 py-1 text-sm bg-blue-600 rounded hover:bg-blue-500"
				>
					Refresh
				</button>
			</div>

			{/* Log entries */}
			<div className="flex-1 overflow-auto font-mono text-xs">
				{filteredLogs.map((log, i) => (
					<div key={i} className="flex border-b border-gray-800 hover:bg-gray-800/50">
						<span className={`w-6 text-center font-bold ${LEVEL_COLORS[log.level] || 'text-gray-400'}`}>
							{log.level}
						</span>
						<span className="w-24 text-gray-500 truncate" title={log.tag}>
							{log.tag}
						</span>
						<span className="w-16 text-gray-600 text-right pr-2" title={`PID: ${log.pid}`}>
							{log.pid}
						</span>
						<span className="flex-1 text-gray-300 break-all">{log.message}</span>
					</div>
				))}
				{filteredLogs.length === 0 && (
					<div className="p-4 text-center text-gray-500">No logs</div>
				)}
				<div ref={bottomRef} />
			</div>
		</div>
	)
}
