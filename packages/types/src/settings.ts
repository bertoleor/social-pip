export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  language: string
  autoStart: boolean
  minimizeToTray: boolean
  checkUpdates: boolean
}

export interface AntiBanSettings {
  enableSafetyMode: boolean
  customLimits: boolean
  maxPostsPerDay: number
  maxPostsPerHour: number
  minDelayBetweenPosts: number
  maxDelayBetweenPosts: number
}

export interface NotificationSettings {
  enableNotifications: boolean
  soundEnabled: boolean
  notifyOnPostComplete: boolean
  notifyOnError: boolean
  notifyOnLimitReached: boolean
}

export interface Settings {
  app: AppSettings
  antiBan: AntiBanSettings
  notifications: NotificationSettings
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'system',
  language: 'en',
  autoStart: false,
  minimizeToTray: false,
  checkUpdates: true,
}

export const DEFAULT_ANTI_BAN_SETTINGS: AntiBanSettings = {
  enableSafetyMode: true,
  customLimits: false,
  maxPostsPerDay: 20,
  maxPostsPerHour: 5,
  minDelayBetweenPosts: 60,
  maxDelayBetweenPosts: 240,
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enableNotifications: true,
  soundEnabled: true,
  notifyOnPostComplete: true,
  notifyOnError: true,
  notifyOnLimitReached: true,
}

export const DEFAULT_SETTINGS: Settings = {
  app: DEFAULT_APP_SETTINGS,
  antiBan: DEFAULT_ANTI_BAN_SETTINGS,
  notifications: DEFAULT_NOTIFICATION_SETTINGS,
}
