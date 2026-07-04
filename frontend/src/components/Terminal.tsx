import { useState, useRef, useEffect } from 'react'
import type { KeyboardEvent } from 'react'
import { useI18n } from '../lib/i18n'
import { GoBridge } from '../lib/types'

interface TerminalProps {
	deviceId: string
}

interface HistoryEntry {
	command: string
	output: string
	timestamp: number
}

export function Terminal({ deviceId }: TerminalProps) {
	const { t } = useI18n()
	const [history, setHistory] = useState<HistoryEntry[]>([])
	const [input, setInput] = useState('')
	const [loading, setLoading] = useState(false)
	const bottomRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [history])

	const executeCommand = async (cmd: string) => {
		if (!cmd.trim()) return

		setLoading(true)
		try {
			const output = await GoBridge.Execute(deviceId, cmd)
			setHistory((prev) => [
				...prev,
				{ command: cmd, output: output || '', timestamp: Date.now() },
			])
		} catch (err) {
			setHistory((prev) => [
				...prev,
				{ command: cmd, output: `Error: ${err}`, timestamp: Date.now() },
			])
		} finally {
			setLoading(false)
			setInput('')
		}
	}

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Enter' && !loading) {
			executeCommand(input)
		}
	}

	return (
		<div className="flex h-full flex-col bg-[#171717] font-mono text-sm text-white">
			<div className="flex min-h-[56px] items-center border-b border-[#151515] bg-[#2f2f2f] px-4">
				<div className="mr-3 grid h-8 w-8 place-items-center rounded-[4px] bg-[#123d4d] text-[#12baf7]">ADB</div>
				<div>
					<div className="text-sm font-semibold">{t('developerOptions')}</div>
					<div className="text-xs text-[#858585]">{deviceId || t('notAssigned')}</div>
				</div>
				<button
					type="button"
					onClick={() => setHistory([])}
					className="ml-auto h-9 rounded-[4px] bg-[#454545] px-4 text-sm font-semibold hover:bg-[#555]"
				>
					{t('clear')}
				</button>
			</div>
			<div className="min-h-0 flex-1 overflow-auto p-4">
				{history.map((entry, i) => (
					<div key={i} className="mb-4 rounded-[4px] border border-[#303030] bg-[#202020] p-3">
						<div className="mb-2 flex items-center gap-2 text-[#12baf7]">
							<span>$</span>
							<span className="break-all">{entry.command}</span>
							<span className="ml-auto text-[11px] text-[#666]">{new Date(entry.timestamp).toLocaleTimeString()}</span>
						</div>
						<pre className="whitespace-pre-wrap break-all text-[#d2d2d2]">{entry.output || 'OK'}</pre>
					</div>
				))}
				{history.length === 0 && !loading && (
					<div className="grid h-full min-h-[280px] place-items-center text-center text-[#777]">
						<div>
							<div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-[4px] bg-[#252525] text-[#12baf7]">ADB</div>
							<div className="font-sans text-sm font-semibold">{t('enterCommand')}</div>
						</div>
					</div>
				)}
				{loading && <div className="text-[#ffce5c]">{t('executing')}</div>}
				<div ref={bottomRef} />
			</div>

			<div className="flex min-h-[54px] items-center border-t border-[#151515] bg-[#202020] px-4">
				<span className="mr-3 text-[#12baf7]">$</span>
				<input
					type="text"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={handleKeyDown}
					disabled={loading}
					className="h-9 flex-1 rounded-[4px] border border-[#454545] bg-[#171717] px-3 text-white outline-none placeholder:text-[#777] focus:border-[#12baf7]"
					placeholder={t('enterCommand')}
					autoFocus
				/>
				<button
					type="button"
					onClick={() => executeCommand(input)}
					disabled={loading || !input.trim()}
					className="ml-3 h-9 rounded-[4px] bg-[#12baf7] px-5 font-sans text-sm font-bold text-[#10212b] hover:bg-[#19c7ff] disabled:cursor-not-allowed disabled:opacity-45"
				>
					{t('execute')}
				</button>
			</div>
		</div>
	)
}
