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
		<div className="flex flex-col h-full bg-gray-900 font-mono text-sm">
			{/* History */}
			<div className="flex-1 overflow-auto p-2">
				{history.map((entry, i) => (
					<div key={i} className="mb-2">
						<div className="text-green-400">$ {entry.command}</div>
						<pre className="text-gray-300 whitespace-pre-wrap">{entry.output}</pre>
					</div>
				))}
				{loading && <div className="text-yellow-400">{t('executing')}</div>}
				<div ref={bottomRef} />
			</div>

			{/* Input */}
			<div className="flex items-center p-2 border-t border-gray-700">
				<span className="text-green-400 mr-2">$</span>
				<input
					type="text"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={handleKeyDown}
					disabled={loading}
					className="flex-1 bg-transparent text-white outline-none"
					placeholder={t('enterCommand')}
					autoFocus
				/>
			</div>
		</div>
	)
}
