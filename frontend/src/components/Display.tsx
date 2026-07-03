import { VncScreen } from 'react-vnc'

interface DisplayProps {
  vmId: string
  vncPort: number
}

export function Display({ vncPort }: DisplayProps) {
  const url = `ws://localhost:${vncPort}`

  return (
    <div className="relative w-full h-full bg-black">
      <VncScreen
        url={url}
        scaleViewport={true}
        qualityLevel={6}
        className="w-full h-full"
      />
    </div>
  )
}
