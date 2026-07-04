import { useState } from 'react'
import { useI18n } from '../lib/i18n'
import type { VMInfo } from '../lib/types'

interface VMCardProps {
  vm: VMInfo
  onStart: (name: string) => void
  onDelete: (name: string) => void
  onOpen: (name: string) => void
}

export function VMCard({ vm, onStart, onDelete, onOpen }: VMCardProps) {
  const { t } = useI18n()
  const [menuOpen, setMenuOpen] = useState(false)

  const statusLabels: Record<string, string> = {
    running: t('running'),
    stopped: t('stopped'),
    starting: t('starting'),
    error: t('error'),
  }

  const isRunning = vm.status === 'running'
  const status = vm.status || 'stopped'
  const androidLabel = vm.android?.replace('android-', 'Android ') || 'Android'
  const resolution = vm.resolution?.replace('x', ' × ') ?? '1280 × 720'

  return (
    <div className="group relative flex min-h-[178px] items-center gap-9 px-9 py-6 pr-44 transition-colors hover:bg-white/[0.03]">
      <button
        type="button"
        onClick={() => onOpen(vm.name)}
        className="relative h-[160px] w-[286px] flex-none overflow-hidden rounded-lg border border-white/15 bg-[#1f2b3a] text-left shadow-inner"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_35%,rgba(68,180,255,0.55),transparent_24%),linear-gradient(130deg,#0f5486_0%,#122a4a_45%,#0b1320_100%)]" />
        <div className="absolute left-4 top-3 rounded-full bg-black/35 px-3 py-1 text-sm"># 0</div>
        <div className="absolute right-9 top-7 grid grid-cols-2 gap-2">
          {['bg-cyan-300', 'bg-amber-300', 'bg-violet-300', 'bg-rose-300'].map((color) => (
            <span key={color} className={`h-4 w-4 rounded ${color}`} />
          ))}
        </div>
        <div className="absolute bottom-0 left-0 right-0 flex h-12 items-center justify-center bg-black/35 text-2xl font-bold">
          <span className="mr-2 text-3xl leading-none">⏻</span>
          {statusLabels[status]}
        </div>
      </button>

      <div className="min-w-0 max-w-[540px] flex-1">
        <button
          type="button"
          onClick={() => onOpen(vm.name)}
          className="block max-w-full truncate text-left text-[32px] font-bold leading-tight hover:text-sky-300"
        >
          {vm.name}
        </button>
        <div className="mt-6 flex flex-wrap items-center gap-3 text-xl text-white">
          <span className="rounded bg-white/10 px-3 py-1">{androidLabel}</span>
          <span className="rounded bg-white/10 px-3 py-1">
            {vm.cpus} {t('cores')}
          </span>
          <span className="rounded bg-white/10 px-3 py-1">{vm.ram}</span>
        </div>
        <div className="relative mt-4 flex flex-wrap items-center gap-4 text-xl text-gray-200">
          <span>{resolution}</span>
          <span className="h-5 w-px bg-white/15" />
          <span>{vm.dpi ?? 240} DPI</span>
          <button
            type="button"
            onClick={() => (isRunning ? onOpen(vm.name) : onStart(vm.name))}
            className="ml-8 grid h-14 w-14 place-items-center rounded-full bg-white/15 text-2xl text-white transition-colors hover:bg-sky-500"
            title={isRunning ? t('open') : t('start')}
          >
            ▶
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="grid h-14 w-14 place-items-center rounded-full bg-white/15 text-3xl leading-none text-white transition-colors hover:bg-white/25"
            title={t('settings')}
          >
            ⋮
          </button>
          {menuOpen && (
            <div className="absolute left-[380px] top-16 z-20 w-64 rounded-lg border border-white/10 bg-[#2b2b2b] py-2 shadow-2xl">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  onOpen(vm.name)
                }}
                className="flex w-full items-center gap-3 px-5 py-3 text-left text-lg hover:bg-white/10"
              >
                <span>▣</span>
                <span>{t('deviceSettings')}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  onDelete(vm.name)
                }}
                className="flex w-full items-center gap-3 px-5 py-3 text-left text-lg text-red-200 hover:bg-white/10"
              >
                <span>⌫</span>
                <span>{t('delete')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
