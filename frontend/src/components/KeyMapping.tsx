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
		canvasRef.current.focus()

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
		<div className="flex h-full bg-[#101114] text-white">
			<div className="relative min-w-0 flex-1 overflow-hidden">
				<div className="absolute inset-0 bg-[linear-gradient(128deg,#11151f_0%,#080a0d_46%,#151922_47%,#090a0d_100%)]" />
				<div className="absolute inset-x-0 top-0 z-10 flex h-[56px] items-center border-b border-black bg-[#1f1f1f]/95 px-4">
					<div className="mr-3 grid h-8 w-8 place-items-center rounded-[4px] bg-[#123d4d] text-[#12baf7]">⌨</div>
					<div>
						<div className="text-sm font-semibold">{t('keyboardGamepad')}</div>
						<div className="text-xs text-[#858585]">{recording ? t('pressKey') : t('keymapCanvasHint')}</div>
					</div>
				</div>
				<canvas
					ref={canvasRef}
					onClick={handleCanvasClick}
					onKeyDown={handleKeyDown}
					tabIndex={0}
					className="relative z-[1] h-full w-full cursor-crosshair bg-transparent outline-none"
				/>

				<div className="pointer-events-none absolute left-[18%] top-[22%] z-[2] grid h-[54px] w-[54px] grid-cols-2 gap-1 rounded-[7px] bg-[#2c3036]/92 p-2 shadow-xl">
					{['#48c5ff', '#f8ca3a', '#56d675', '#ffffff'].map((color) => (
						<span key={color} className="rounded-[3px]" style={{ backgroundColor: color }} />
					))}
				</div>
				<div className="pointer-events-none absolute left-[18%] top-[calc(22%+64px)] z-[2] -translate-x-4 text-xs text-white/82">System Application</div>

				{config.mappings.map((mapping, i) => (
					<div
						key={i}
						className={`absolute z-[3] flex h-9 min-w-9 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-2 px-2 text-xs font-black shadow-xl ${
							selectedMapping === i
								? 'border-[#12baf7] bg-[#12baf7] text-[#10212b]'
								: 'border-white/70 bg-black/55 text-white'
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

			<div className="w-[320px] flex-none border-l border-[#151515] bg-[#242424]">
				<div className="flex h-[56px] items-center border-b border-[#151515] px-5">
					<div className="text-base font-semibold">{t('keyMapping')}</div>
					<div className="ml-auto rounded-[4px] bg-[#333] px-2 py-1 text-xs text-[#9c9c9c]">{config.mappings.length}</div>
				</div>
				<div className="p-5">
					<label className="mb-5 block">
						<span className="mb-2 block text-xs font-semibold text-[#9c9c9c]">{t('name')}</span>
						<input
							type="text"
							value={config.name}
							onChange={(e) => setConfig((prev) => ({ ...prev, name: e.target.value }))}
							className="h-10 w-full rounded-[4px] border border-[#4a4a4a] bg-[#1b1b1b] px-3 text-sm text-white outline-none focus:border-[#12baf7]"
						/>
					</label>

					<div className="mb-4 text-xs font-semibold text-[#9c9c9c]">{t('keyMapping')}</div>
					<div className="mb-5 max-h-[calc(100vh-250px)] space-y-2 overflow-auto pr-1">
						{config.mappings.length === 0 && (
							<div className="rounded-[4px] border border-dashed border-[#464646] p-4 text-center text-sm text-[#8f8f8f]">
								{t('keymapCanvasHint')}
							</div>
						)}
						{config.mappings.map((mapping, i) => (
							<div
								key={i}
								className={`flex min-h-12 cursor-pointer items-center rounded-[4px] border px-3 ${
									selectedMapping === i ? 'border-[#12baf7] bg-[#123d4d]' : 'border-[#3d3d3d] bg-[#303030] hover:bg-[#363636]'
								}`}
								onClick={() => setSelectedMapping(i)}
							>
								<span className="mr-3 grid h-7 w-7 place-items-center rounded-full bg-[#12baf7] text-xs font-black text-[#10212b]">
									{mapping.key || '?'}
								</span>
								<span className="min-w-0 flex-1 truncate text-sm">
									{Math.round(mapping.touchX * 100)}, {Math.round(mapping.touchY * 100)}
								</span>
								<button
									onClick={(e) => {
										e.stopPropagation()
										deleteMapping(i)
									}}
									className="grid h-8 w-8 place-items-center rounded-[4px] text-[#ff7b7b] hover:bg-[#5a2f2f]"
								>
									×
								</button>
							</div>
						))}
					</div>

					{recording && (
						<div className="mb-4 rounded-[4px] bg-[#3d3218] p-3 text-sm font-semibold text-[#ffce5c]">{t('pressKey')}</div>
					)}

					<button
						onClick={() => onSave(config)}
						className="h-10 w-full rounded-[4px] bg-[#12baf7] px-4 font-bold text-[#10212b] hover:bg-[#19c7ff]"
					>
						{t('save')}
					</button>
				</div>
			</div>
		</div>
	)
}
