import { useState, useRef } from 'react'
import type { KeyboardEvent, MouseEvent } from 'react'
import { useI18n } from '../lib/i18n'

interface TouchMapping {
	key: string
	touchX: number
	touchY: number
	action: 'tap' | 'swipe' | 'drag'
	swipeEndX?: number
	swipeEndY?: number
}

interface KeyMappingConfig {
	name: string
	mappings: TouchMapping[]
}

interface KeyMappingProps {
	onSave: (config: KeyMappingConfig) => void
}

export function KeyMapping({ onSave }: KeyMappingProps) {
	const { t } = useI18n()
	const [config, setConfig] = useState<KeyMappingConfig>({
		name: t('newProfile'),
		mappings: [],
	})
	const [selectedMapping, setSelectedMapping] = useState<number | null>(null)
	const [recording, setRecording] = useState(false)
	const canvasRef = useRef<HTMLCanvasElement>(null)

	const handleCanvasClick = (e: MouseEvent<HTMLCanvasElement>) => {
		if (!canvasRef.current || recording) return

		const rect = canvasRef.current.getBoundingClientRect()
		const x = (e.clientX - rect.left) / rect.width
		const y = (e.clientY - rect.top) / rect.height

		const newMapping: TouchMapping = {
			key: '',
			touchX: x,
			touchY: y,
			action: 'tap',
		}

		setConfig((prev) => ({
			...prev,
			mappings: [...prev.mappings, newMapping],
		}))
		setSelectedMapping(config.mappings.length)
		setRecording(true)
	}

	const handleKeyDown = (e: KeyboardEvent) => {
		if (!recording || selectedMapping === null) return

		e.preventDefault()
		const key = e.key === ' ' ? 'Space' : e.key

		setConfig((prev) => {
			const mappings = [...prev.mappings]
			mappings[selectedMapping] = {
				...mappings[selectedMapping],
				key,
			}
			return { ...prev, mappings }
		})

		setRecording(false)
	}

	const deleteMapping = (index: number) => {
		setConfig((prev) => ({
			...prev,
			mappings: prev.mappings.filter((_, i) => i !== index),
		}))
		setSelectedMapping(null)
	}

	return (
		<div className="flex h-full">
			{/* Canvas */}
			<div className="flex-1 relative">
				<canvas
					ref={canvasRef}
					onClick={handleCanvasClick}
					onKeyDown={handleKeyDown}
					tabIndex={0}
					className="w-full h-full bg-gray-800 cursor-crosshair"
				/>

				{/* Mapping points */}
				{config.mappings.map((mapping, i) => (
					<div
						key={i}
						className={`absolute w-6 h-6 rounded-full border-2 cursor-pointer transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-xs font-bold ${
							selectedMapping === i
								? 'bg-blue-600 border-blue-400'
								: 'bg-gray-600 border-gray-400'
						}`}
						style={{
							left: `${mapping.touchX * 100}%`,
							top: `${mapping.touchY * 100}%`,
						}}
						onClick={(e) => {
							e.stopPropagation()
							setSelectedMapping(i)
						}}
					>
						{mapping.key || '?'}
					</div>
				))}
			</div>

			{/* Sidebar */}
			<div className="w-64 bg-gray-800 border-l border-gray-700 p-4">
				<h3 className="text-lg font-bold mb-4">{t('keyMapping')}</h3>

				<input
					type="text"
					value={config.name}
					onChange={(e) => setConfig((prev) => ({ ...prev, name: e.target.value }))}
					className="w-full px-2 py-1 bg-gray-700 rounded text-white mb-4"
				/>

				<div className="space-y-2 mb-4">
					{config.mappings.map((mapping, i) => (
						<div
							key={i}
							className={`flex items-center justify-between p-2 rounded ${
								selectedMapping === i ? 'bg-blue-900' : 'bg-gray-700'
							}`}
							onClick={() => setSelectedMapping(i)}
						>
							<span className="text-sm">
								{mapping.key || '?'} → ({Math.round(mapping.touchX * 100)},{' '}
								{Math.round(mapping.touchY * 100)})
							</span>
							<button
								onClick={(e) => {
								e.stopPropagation()
								deleteMapping(i)
							}}
								className="text-red-400 hover:text-red-300"
							>
								×
							</button>
						</div>
					))}
				</div>

				{recording && (
					<div className="text-yellow-400 text-sm mb-4">{t('pressKey')}</div>
				)}

				<div className="space-y-2">
					<button
						onClick={() => onSave(config)}
						className="w-full px-4 py-2 bg-blue-600 rounded hover:bg-blue-500"
					>
						{t('save')}
					</button>
				</div>
			</div>
		</div>
	)
}
