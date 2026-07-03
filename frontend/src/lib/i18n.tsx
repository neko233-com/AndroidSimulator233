import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export type Language = 'zh' | 'en'

type I18nContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string) => string
}

const messages: Record<Language, Record<string, string>> = {
  en: {
    appTitle: 'AndroidSimulator233',
    display: 'Display',
    multiInstance: 'Multi-instance',
    fileManager: 'File Manager',
    shell: 'Shell',
    logs: 'Logs',
    keyMapping: 'Key Mapping',
    settings: 'Settings',
    devices: 'Devices',
    running: 'Running',
    noDevices: 'No devices',
    loadingDevices: 'Loading devices...',
    multiInstanceTitle: 'Multi-instance Manager',
    multiInstanceSubtitle: 'Create, launch, and manage Android devices.',
    createDevice: 'Create Device',
    createNewDevice: 'Create New Device',
    deviceName: 'Device Name',
    androidVersion: 'Android Version',
    resolution: 'Resolution',
    dpi: 'DPI',
    frameRate: 'Frame rate',
    renderer: 'Renderer',
    phoneModel: 'Phone model',
    performance: 'Performance',
    lowPower: 'Low',
    balanced: 'Balanced',
    highPerformance: 'High performance',
    custom: 'Custom',
    recommended: 'Recommended',
    preparingImage: 'Preparing Android image...',
    creating: 'Creating...',
    create: 'Create',
    cancel: 'Cancel',
    delete: 'Delete',
    start: 'Start',
    open: 'Open',
    stopped: 'Stopped',
    starting: 'Starting...',
    error: 'Error',
    noDevicesYet: 'No Devices Yet',
    createFirstDevice: 'Create your first Android device to get started.',
    preinstalledApps: 'Pre-installed Apps',
    preinstalledAppsHint: 'New devices prepare the common gaming and app-store baseline.',
    deleteConfirm: 'Delete VM "{name}"? This will remove all data.',
    createFailed: 'Failed to create VM: ',
    deleteFailed: 'Failed to delete VM: ',
    startFailed: 'Failed to start VM: ',
    noDeviceSelected: 'No device selected',
    openManager: 'Open Multi-instance Manager',
    refresh: 'Refresh',
    reset: 'Reset',
    stop: 'Stop',
    stopFailed: 'Failed to stop VM: ',
    resetFailed: 'Failed to reset VM: ',
    adb: 'ADB',
    vnc: 'VNC',
    startDisplay: 'Start the device to connect the display',
    createOrSelect: 'Create or select a device',
    appLogs: 'App logs',
    androidLogs: 'Android logs',
    logPath: 'Log path',
    filterByTag: 'Filter by tag...',
    searchLogs: 'Search logs...',
    autoScroll: 'Auto-scroll',
    export: 'Export',
    noLogs: 'No logs',
    loadFilesFailed: 'Failed to load files:',
    loading: 'Loading...',
    emptyDirectory: 'Empty directory',
    name: 'Name',
    size: 'Size',
    root: 'Root',
    rootPermission: 'Root permission',
    enabled: 'Enabled',
    disabled: 'Disabled',
    executing: 'Executing...',
    enterCommand: 'Enter command...',
    savedKeymapProfile: 'Saved keymap profile: ',
    newProfile: 'New Profile',
    pressKey: 'Press a key...',
    save: 'Save',
    deviceSettings: 'Device Settings',
    android: 'Android',
    cpu: 'CPU',
    ram: 'RAM',
    memory: 'Memory',
    cores: 'cores',
    adbEndpoint: 'ADB endpoint',
    displayEndpoint: 'Display endpoint',
    notAssigned: 'Not assigned',
    language: 'Language',
    english: 'English',
    chinese: '中文',
  },
  zh: {
    appTitle: 'AndroidSimulator233',
    display: '显示',
    multiInstance: '多开管理',
    fileManager: '文件管理',
    shell: '命令行',
    logs: '日志',
    keyMapping: '键位映射',
    settings: '设置',
    devices: '设备',
    running: '运行中',
    noDevices: '暂无设备',
    loadingDevices: '正在加载设备...',
    multiInstanceTitle: '多开管理器',
    multiInstanceSubtitle: '创建、启动和管理 Android 模拟器。',
    createDevice: '创建设备',
    createNewDevice: '创建新设备',
    deviceName: '设备名称',
    androidVersion: 'Android 版本',
    resolution: '分辨率',
    dpi: 'DPI',
    frameRate: '帧率',
    renderer: '渲染模式',
    phoneModel: '手机型号',
    performance: '性能配置',
    lowPower: '低配',
    balanced: '均衡',
    highPerformance: '高性能',
    custom: '自定义',
    recommended: '推荐',
    preparingImage: '正在准备 Android 镜像...',
    creating: '创建中...',
    create: '创建',
    cancel: '取消',
    delete: '删除',
    start: '启动',
    open: '打开',
    stopped: '未开机',
    starting: '启动中...',
    error: '错误',
    noDevicesYet: '暂无设备',
    createFirstDevice: '创建第一台 Android 模拟器开始使用。',
    preinstalledApps: '预装应用',
    preinstalledAppsHint: '新设备会准备常用游戏和应用商店基础环境。',
    deleteConfirm: '删除模拟器“{name}”？这会移除所有数据。',
    createFailed: '创建设备失败：',
    deleteFailed: '删除设备失败：',
    startFailed: '启动设备失败：',
    noDeviceSelected: '未选择设备',
    openManager: '打开多开管理器',
    refresh: '刷新',
    reset: '重启',
    stop: '关机',
    stopFailed: '关机失败：',
    resetFailed: '重启失败：',
    adb: 'ADB',
    vnc: 'VNC',
    startDisplay: '启动设备后连接显示画面',
    createOrSelect: '创建或选择一台设备',
    appLogs: '应用日志',
    androidLogs: 'Android 日志',
    logPath: '日志路径',
    filterByTag: '按标签过滤...',
    searchLogs: '搜索日志...',
    autoScroll: '自动滚动',
    export: '导出',
    noLogs: '暂无日志',
    loadFilesFailed: '加载文件失败：',
    loading: '加载中...',
    emptyDirectory: '空目录',
    name: '名称',
    size: '大小',
    root: '根目录',
    rootPermission: 'Root 权限',
    enabled: '开启',
    disabled: '关闭',
    executing: '执行中...',
    enterCommand: '输入命令...',
    savedKeymapProfile: '已保存键位方案：',
    newProfile: '新方案',
    pressKey: '请按一个按键...',
    save: '保存',
    deviceSettings: '设备设置',
    android: 'Android',
    cpu: 'CPU',
    ram: '内存',
    memory: '内存',
    cores: '核',
    adbEndpoint: 'ADB 地址',
    displayEndpoint: '显示地址',
    notAssigned: '未分配',
    language: '语言',
    english: 'English',
    chinese: '中文',
  },
}

const I18nContext = createContext<I18nContextValue | null>(null)

function detectLanguage(): Language {
  try {
    const saved = window.localStorage?.getItem('language')
    if (saved === 'zh' || saved === 'en') return saved
  } catch {
    // WebView2 may deny storage during early startup; fall back to browser language.
  }

  const browserLanguage = typeof navigator === 'undefined' ? 'en' : navigator.language
  return browserLanguage.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(detectLanguage)

  const value = useMemo<I18nContextValue>(() => {
    const setLanguage = (next: Language) => {
      try {
        window.localStorage?.setItem('language', next)
      } catch {
        // Language still changes for the current session when persistence is unavailable.
      }
      setLanguageState(next)
    }

    return {
      language,
      setLanguage,
      t: (key: string) => messages[language][key] ?? messages.en[key] ?? key,
    }
  }, [language])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used inside I18nProvider')
  }
  return context
}
