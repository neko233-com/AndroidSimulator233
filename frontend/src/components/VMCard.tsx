import { useI18n } from '../lib/i18n'
import { VMInfo } from '../lib/types'

interface VMCardProps {
  vm: VMInfo
  onStart: (name: string) => void
  onDelete: (name: string) => void
  onOpen: (name: string) => void
}

export function VMCard({ vm, onStart, onDelete, onOpen }: VMCardProps) {
  const { t } = useI18n()
  const statusColors: Record<string, string> = {
    running: 'bg-green-500',
    stopped: 'bg-gray-500',
    starting: 'bg-yellow-500',
    error: 'bg-red-500',
  }

  const statusLabels: Record<string, string> = {
    running: t('running'),
    stopped: t('stopped'),
    starting: t('starting'),
    error: t('error'),
  }

  const isRunning = vm.status === 'running'

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 hover:border-gray-600 transition-colors">
      {/* Device Preview */}
      <div className="aspect-[9/16] bg-gray-700 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
        {isRunning ? (
          <div className="absolute inset-0 bg-gradient-to-b from-gray-600 to-gray-800">
            {/* Simulated Android screen */}
            <div className="p-2">
              <div className="text-xs text-gray-400 mb-2">Status Bar</div>
              <div className="grid grid-cols-4 gap-1">
                <div className="w-8 h-8 bg-blue-500/30 rounded"></div>
                <div className="w-8 h-8 bg-green-500/30 rounded"></div>
                <div className="w-8 h-8 bg-yellow-500/30 rounded"></div>
                <div className="w-8 h-8 bg-red-500/30 rounded"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-4xl mb-2">📱</div>
            <div className="text-xs text-gray-500">{vm.android}</div>
          </div>
        )}
        
        {/* Status Badge */}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs ${statusColors[vm.status || 'stopped']}`}>
          {statusLabels[vm.status || 'stopped']}
        </div>
      </div>

      {/* Device Info */}
      <div className="mb-4">
        <h3 className="font-bold text-lg">{vm.name}</h3>
        <div className="text-sm text-gray-400 mt-1">
          <div>{vm.android}</div>
          <div>{vm.cpus} {t('cores')} · {vm.ram} {t('ram')}</div>
          {vm.resolution && <div>{vm.resolution} · {vm.dpi ?? 240} DPI</div>}
          <div>{vm.renderer ?? 'vulkan'} · {vm.maxFps ?? 60} FPS</div>
        </div>
      </div>

      {/* Pre-installed Apps */}
      <div className="mb-4">
        <div className="text-xs text-gray-500 mb-1">{t('preinstalledApps')}:</div>
        <div className="flex gap-1 flex-wrap">
          <span className="px-2 py-0.5 bg-gray-700 rounded text-xs">Chrome</span>
          <span className="px-2 py-0.5 bg-gray-700 rounded text-xs">TapTap</span>
          <span className="px-2 py-0.5 bg-gray-700 rounded text-xs">Play Store</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {!isRunning ? (
          <button
            onClick={() => onStart(vm.name)}
            className="flex-1 px-4 py-2 bg-green-600 rounded hover:bg-green-500 font-medium"
          >
            {t('start')}
          </button>
        ) : (
          <button
            onClick={() => onOpen(vm.name)}
            className="flex-1 px-4 py-2 bg-gray-600 rounded hover:bg-gray-500"
          >
            {t('open')}
          </button>
        )}
        <button
          onClick={() => onDelete(vm.name)}
          className="px-4 py-2 bg-red-600/50 rounded hover:bg-red-500/50"
        >
          {t('delete')}
        </button>
      </div>
    </div>
  )
}
