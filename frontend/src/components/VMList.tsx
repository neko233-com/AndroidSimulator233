import { useState, useEffect } from 'react'
import { VMCard } from './VMCard'
import { VMInfo, GoBridge } from '../lib/types'

export function VMList() {
  const [vms, setVMs] = useState<VMInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newVMName, setNewVMName] = useState('')
  const [selectedAndroid, setSelectedAndroid] = useState('android-15')
  const [downloading, setDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState('')

  useEffect(() => {
    loadVMs()
  }, [])

  const loadVMs = async () => {
    try {
      const result = await GoBridge.ListVMs()
      setVMs(result || [])
    } catch (err) {
      console.error('Failed to load VMs:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newVMName.trim()) return

    setDownloading(true)
    setDownloadProgress('Ensuring Android image is ready...')

    try {
      // Ensure image is downloaded
      await GoBridge.EnsureImageReady(selectedAndroid)
      
      // Create VM
      await GoBridge.CreateVM(newVMName.trim(), selectedAndroid)
      setShowCreate(false)
      setNewVMName('')
      loadVMs()
    } catch (err) {
      alert('Failed to create VM: ' + err)
    } finally {
      setDownloading(false)
      setDownloadProgress('')
    }
  }

  const handleDelete = async (name: string) => {
    if (!confirm(`Delete VM "${name}"? This will remove all data.`)) return

    try {
      await GoBridge.DeleteVM(name)
      loadVMs()
    } catch (err) {
      alert('Failed to delete VM: ' + err)
    }
  }

  const handleStart = async (name: string) => {
    try {
      await GoBridge.StartVM(name)
      loadVMs()
    } catch (err) {
      alert('Failed to start VM: ' + err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-gray-400">Loading devices...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Device Manager</h2>
          <p className="text-gray-400 text-sm mt-1">Manage your Android virtual machines</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 flex items-center gap-2"
        >
          <span>+</span>
          <span>Create Device</span>
        </button>
      </div>

      {/* Create Device Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold mb-4">Create New Device</h3>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Device Name</label>
              <input
                type="text"
                value={newVMName}
                onChange={(e) => setNewVMName(e.target.value)}
                placeholder="My Android Device"
                className="w-full px-3 py-2 bg-gray-700 rounded text-white"
                autoFocus
                disabled={downloading}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">Android Version</label>
              <select
                value={selectedAndroid}
                onChange={(e) => setSelectedAndroid(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded text-white"
                disabled={downloading}
              >
                <option value="android-15">Android 15 (Recommended)</option>
                <option value="android-14">Android 14</option>
                <option value="android-12">Android 12</option>
              </select>
            </div>

            {downloading && (
              <div className="mb-4 p-3 bg-blue-900/50 rounded">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                  <span className="text-sm">{downloadProgress}</span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 px-4 py-2 bg-gray-600 rounded hover:bg-gray-500"
                disabled={downloading}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 px-4 py-2 bg-blue-600 rounded hover:bg-blue-500"
                disabled={downloading || !newVMName.trim()}
              >
                {downloading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VM List */}
      {vms.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📱</div>
          <h3 className="text-xl font-bold mb-2">No Devices Yet</h3>
          <p className="text-gray-400 mb-6">Create your first Android device to get started</p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-500"
          >
            Create Device
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vms.map((vm) => (
            <VMCard
              key={vm.name}
              vm={vm}
              onStart={handleStart}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Pre-installed Apps Info */}
      <div className="mt-8 p-4 bg-gray-800 rounded-lg">
        <h3 className="font-bold mb-2">Pre-installed Apps</h3>
        <p className="text-gray-400 text-sm mb-3">New devices come with these apps pre-installed:</p>
        <div className="flex gap-2 flex-wrap">
          <span className="px-3 py-1 bg-gray-700 rounded-full text-sm">Chrome</span>
          <span className="px-3 py-1 bg-gray-700 rounded-full text-sm">TapTap</span>
          <span className="px-3 py-1 bg-gray-700 rounded-full text-sm">Play Store</span>
          <span className="px-3 py-1 bg-gray-700 rounded-full text-sm">Play Services</span>
        </div>
      </div>
    </div>
  )
}
