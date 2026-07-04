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
		<div className="flex h-full flex-col bg-[#202020] text-white">
			<div className="flex min-h-[56px] items-center gap-2 border-b border-[#151515] bg-[#2f2f2f] px-4">
				<div className="flex h-9 overflow-hidden rounded-[4px] bg-[#444] p-0.5 text-sm font-semibold">
					<button
						onClick={() => setMode('app')}
						className={`px-4 ${mode === 'app' ? 'rounded-[3px] bg-[#12baf7] text-[#10212b]' : 'text-[#d9d9d9] hover:bg-white/8'}`}
					>
						{t('appLogs')}
					</button>
					<button
						onClick={() => setMode('android')}
						className={`px-4 ${mode === 'android' ? 'rounded-[3px] bg-[#12baf7] text-[#10212b]' : 'text-[#d9d9d9] hover:bg-white/8'}`}
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
							className="h-9 w-40 rounded-[4px] border border-[#4a4a4a] bg-[#252525] px-3 text-sm text-white outline-none focus:border-[#12baf7]"
						/>
						<select
							value={level}
							onChange={(e) => setLevel(e.target.value)}
							className="h-9 rounded-[4px] border border-[#4a4a4a] bg-[#252525] px-3 text-sm text-white outline-none"
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
					className="h-9 min-w-[180px] flex-1 rounded-[4px] border border-[#4a4a4a] bg-[#252525] px-3 text-sm text-white outline-none placeholder:text-[#777] focus:border-[#12baf7]"
				/>
				<label className="flex h-9 items-center gap-2 rounded-[4px] bg-[#3b3b3b] px-3 text-sm font-medium text-[#d0d0d0]">
					<input
						type="checkbox"
						checked={autoScroll}
						onChange={(e) => setAutoScroll(e.target.checked)}
						className="accent-[#12baf7]"
					/>
					{t('autoScroll')}
				</label>
				<button
					onClick={handleExport}
					className="h-9 rounded-[4px] bg-[#454545] px-4 text-sm font-semibold hover:bg-[#555]"
				>
					{t('export')}
				</button>
				<button
					onClick={loadLogs}
					className="h-9 rounded-[4px] bg-[#12baf7] px-4 text-sm font-bold text-[#10212b] hover:bg-[#19c7ff]"
				>
					{t('refresh')}
				</button>
			</div>

			<div className="min-h-0 flex-1 overflow-auto bg-[#171717] font-mono text-xs">
				{mode === 'app' && (
					<div className="min-h-full border-b border-[#282828] bg-[#171717] p-4 text-[#d2d2d2]">
						<div className="mb-3 rounded-[4px] border border-[#383838] bg-[#222] px-3 py-2 text-[#8f8f8f]">{t('logPath')}: {appLogPath || '-'}</div>
						<pre className="whitespace-pre-wrap break-all leading-5">{filteredAppLogs || t('noLogs')}</pre>
						<div ref={bottomRef} />
					</div>
				)}
				{mode === 'android' && filteredLogs.map((log, i) => (
					<div key={i} className="flex min-h-8 items-start border-b border-[#282828] px-2 py-1 hover:bg-[#242424]">
						<span className={`w-6 text-center font-bold ${LEVEL_COLORS[log.level] || 'text-gray-400'}`}>
							{log.level}
						</span>
						<span className="w-28 truncate text-[#777]" title={log.tag}>
							{log.tag}
						</span>
						<span className="w-16 pr-2 text-right text-[#666]" title={`PID: ${log.pid}`}>
							{log.pid}
						</span>
						<span className="flex-1 break-all text-[#d2d2d2]">{log.message}</span>
					</div>
				))}
				{mode === 'android' && filteredLogs.length === 0 && (
					<div className="p-10 text-center text-[#777]">{t('noLogs')}</div>
				)}
				{mode === 'android' && <div ref={bottomRef} />}
			</div>
		</div>
	)
}
