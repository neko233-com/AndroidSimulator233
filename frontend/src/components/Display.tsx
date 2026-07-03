import { VncScreen } from 'react-vnc'
import { useI18n } from '../lib/i18n'
import type { VMInfo } from '../lib/types'

interface DisplayProps {
  vm?: VMInfo
}

export function Display({ vm }: DisplayProps) {
  const { t } = useI18n()
  const isRunning = vm?.status === 'running' || vm?.status === 'starting'
  const url = `ws://127.0.0.1:${vm?.vncPort ?? 5700}`

  return (
    <div className="relative w-full h-full min-h-[520px] bg-black">
      {isRunning ? (
        <VncScreen
          url={url}
          scaleViewport={true}
          qualityLevel={7}
          className="w-full h-full"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-36 w-20 rounded-2xl border border-gray-600 bg-gray-900 shadow-inner" />
            <div className="text-lg font-semibold">{vm ? vm.name : t('noDeviceSelected')}</div>
            <div className="mt-1 text-sm text-gray-500">
              {vm ? t('startDisplay') : t('createOrSelect')}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
