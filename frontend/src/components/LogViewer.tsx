import { useState, useEffect, useRef } from 'react'
import { useI18n } from '../lib/i18n'
import type { LogEntry } from '../lib/types'
import { GoBridge } from '../lib/types'

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
	const { t } = useI18n()
	const [mode, setMode] = useState<'app' | 'android'>('app')
	const [logs, setLogs] = useState<LogEntry[]>([])
	const [appLogs, setAppLogs] = useState('')
	const [appLogPath, setAppLogPath] = useState('')
	const [filter, setFilter] = useState('')
	const [level, setLevel] = useState('V')
	const [autoScroll, setAutoScroll] = useState(true)
	const [search, setSearch] = useState('')
	const bottomRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		loadLogs()
		const interval = setInterval(loadLogs, 1000)
		return () => clearInterval(interval)
	}, [filter, level, mode])

	useEffect(() => {
		if (autoScroll) {
			bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
		}
	}, [logs, appLogs, autoScroll])

	const loadLogs = async () => {
		try {
			if (mode === 'app') {
				const [path, text] = await Promise.all([
					GoBridge.GetAppLogPath(),
					GoBridge.GetAppLogs(128 * 1024),
				])
				setAppLogPath(path)
				setAppLogs(text || '')
				return
			}

			const filterStr = filter ? `${filter}:* ${level}:*` : `*:${level}`
			const result = await GoBridge.GetLogs(deviceId, filterStr)
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

	const filteredAppLogs = search
		? appLogs
				.split('\n')
				.filter((line) => line.toLowerCase().includes(search.toLowerCase()))
				.join('\n')
		: appLogs

	const handleExport = () => {
		const text = mode === 'app'
			? filteredAppLogs
			: filteredLogs
					.map((log) => `[${log.level}] ${log.tag} (PID:${log.pid}): ${log.message}`)
					.join('\n')
		const blob = new Blob([text], { type: 'text/plain' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `${mode}_logs_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`
		a.click()
		URL.revokeObjectURL(url)
	}

	return (
		<div className="flex flex-col h-full bg-gray-900">
			{/* Filters */}
			<div className="flex items-center gap-2 p-2 bg-gray-800 border-b border-gray-700">
				<div className="flex overflow-hidden rounded bg-gray-700 p-0.5 text-sm">
					<button
						onClick={() => setMode('app')}
						className={`px-3 py-1 ${mode === 'app' ? 'rounded bg-blue-600 text-white' : 'text-gray-300'}`}
					>
						{t('appLogs')}
					</button>
					<button
						onClick={() => setMode('android')}
						className={`px-3 py-1 ${mode === 'android' ? 'rounded bg-blue-600 text-white' : 'text-gray-300'}`}
					>
						{t('androidLogs')}
					</button>
				</div>
				{mode === 'android' && (
					<>
						<input
							type="text"
							value={filter}
							onChange={(e) => setFilter(e.target.value)}
							placeholder={t('filterByTag')}
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
					</>
				)}
				<input
					type="text"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder={t('searchLogs')}
					className="px-2 py-1 text-sm bg-gray-700 rounded text-white flex-1"
				/>
				<label className="flex items-center gap-1 text-sm text-gray-400">
					<input
						type="checkbox"
						checked={autoScroll}
						onChange={(e) => setAutoScroll(e.target.checked)}
					/>
					{t('autoScroll')}
				</label>
				<button
					onClick={handleExport}
					className="px-2 py-1 text-sm bg-gray-600 rounded hover:bg-gray-500"
				>
					{t('export')}
				</button>
				<button
					onClick={loadLogs}
					className="px-2 py-1 text-sm bg-blue-600 rounded hover:bg-blue-500"
				>
					{t('refresh')}
				</button>
			</div>

			{/* Log entries */}
			<div className="flex-1 overflow-auto font-mono text-xs">
				{mode === 'app' && (
					<div className="border-b border-gray-800 bg-gray-950 p-2 text-gray-300">
						<div className="mb-2 text-gray-500">{t('logPath')}: {appLogPath || '-'}</div>
						<pre className="whitespace-pre-wrap break-all">{filteredAppLogs || t('noLogs')}</pre>
						<div ref={bottomRef} />
					</div>
				)}
				{mode === 'android' && filteredLogs.map((log, i) => (
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
				{mode === 'android' && filteredLogs.length === 0 && (
					<div className="p-4 text-center text-gray-500">{t('noLogs')}</div>
				)}
				{mode === 'android' && <div ref={bottomRef} />}
			</div>
		</div>
	)
}
