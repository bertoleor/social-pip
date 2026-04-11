import { describe, it, expect } from 'vitest'
import type {
  AppSettings,
  AntiBanSettings,
  NotificationSettings,
  Settings,
} from './settings'
import {
  DEFAULT_APP_SETTINGS,
  DEFAULT_ANTI_BAN_SETTINGS,
  DEFAULT_NOTIFICATION_SETTINGS,
  DEFAULT_SETTINGS,
} from './settings'

describe('Settings Types', () => {
  describe('AppSettings', () => {
    it('has required theme property with valid values', () => {
      const settings: AppSettings = {
        theme: 'light',
        language: 'en',
        autoStart: false,
        minimizeToTray: false,
        checkUpdates: true,
      }

      expect(settings.theme).toBe('light')
    })

    it('accepts dark theme', () => {
      const settings: AppSettings = {
        theme: 'dark',
        language: 'en',
        autoStart: false,
        minimizeToTray: false,
        checkUpdates: true,
      }

      expect(settings.theme).toBe('dark')
    })

    it('accepts system theme', () => {
      const settings: AppSettings = {
        theme: 'system',
        language: 'en',
        autoStart: false,
        minimizeToTray: false,
        checkUpdates: true,
      }

      expect(settings.theme).toBe('system')
    })
  })

  describe('AntiBanSettings', () => {
    it('has required properties for anti-ban configuration', () => {
      const settings: AntiBanSettings = {
        enableSafetyMode: true,
        customLimits: false,
        maxPostsPerDay: 20,
        maxPostsPerHour: 5,
        minDelayBetweenPosts: 60,
        maxDelayBetweenPosts: 240,
      }

      expect(settings.enableSafetyMode).toBe(true)
      expect(settings.customLimits).toBe(false)
      expect(settings.maxPostsPerDay).toBe(20)
      expect(settings.maxPostsPerHour).toBe(5)
      expect(settings.minDelayBetweenPosts).toBe(60)
      expect(settings.maxDelayBetweenPosts).toBe(240)
    })

    it('allows custom limits configuration', () => {
      const settings: AntiBanSettings = {
        enableSafetyMode: false,
        customLimits: true,
        maxPostsPerDay: 10,
        maxPostsPerHour: 3,
        minDelayBetweenPosts: 120,
        maxDelayBetweenPosts: 300,
      }

      expect(settings.customLimits).toBe(true)
      expect(settings.maxPostsPerDay).toBe(10)
    })
  })

  describe('NotificationSettings', () => {
    it('has all notification preference properties', () => {
      const settings: NotificationSettings = {
        enableNotifications: true,
        soundEnabled: true,
        notifyOnPostComplete: true,
        notifyOnError: true,
        notifyOnLimitReached: true,
      }

      expect(settings.enableNotifications).toBe(true)
      expect(settings.soundEnabled).toBe(true)
      expect(settings.notifyOnPostComplete).toBe(true)
      expect(settings.notifyOnError).toBe(true)
      expect(settings.notifyOnLimitReached).toBe(true)
    })

    it('allows disabling specific notifications', () => {
      const settings: NotificationSettings = {
        enableNotifications: true,
        soundEnabled: false,
        notifyOnPostComplete: false,
        notifyOnError: true,
        notifyOnLimitReached: false,
      }

      expect(settings.soundEnabled).toBe(false)
      expect(settings.notifyOnPostComplete).toBe(false)
      expect(settings.notifyOnLimitReached).toBe(false)
    })
  })

  describe('Settings', () => {
    it('combines all settings sections', () => {
      const settings: Settings = {
        app: {
          theme: 'dark',
          language: 'en',
          autoStart: true,
          minimizeToTray: true,
          checkUpdates: true,
        },
        antiBan: {
          enableSafetyMode: true,
          customLimits: false,
          maxPostsPerDay: 20,
          maxPostsPerHour: 5,
          minDelayBetweenPosts: 60,
          maxDelayBetweenPosts: 240,
        },
        notifications: {
          enableNotifications: true,
          soundEnabled: true,
          notifyOnPostComplete: true,
          notifyOnError: true,
          notifyOnLimitReached: true,
        },
      }

      expect(settings.app.theme).toBe('dark')
      expect(settings.antiBan.enableSafetyMode).toBe(true)
      expect(settings.notifications.enableNotifications).toBe(true)
    })
  })

  describe('DEFAULT_APP_SETTINGS', () => {
    it('provides sensible defaults', () => {
      expect(DEFAULT_APP_SETTINGS.theme).toBe('system')
      expect(DEFAULT_APP_SETTINGS.language).toBe('en')
      expect(DEFAULT_APP_SETTINGS.autoStart).toBe(false)
      expect(DEFAULT_APP_SETTINGS.minimizeToTray).toBe(false)
      expect(DEFAULT_APP_SETTINGS.checkUpdates).toBe(true)
    })
  })

  describe('DEFAULT_ANTI_BAN_SETTINGS', () => {
    it('provides safe anti-ban defaults', () => {
      expect(DEFAULT_ANTI_BAN_SETTINGS.enableSafetyMode).toBe(true)
      expect(DEFAULT_ANTI_BAN_SETTINGS.customLimits).toBe(false)
      expect(DEFAULT_ANTI_BAN_SETTINGS.maxPostsPerDay).toBe(20)
      expect(DEFAULT_ANTI_BAN_SETTINGS.maxPostsPerHour).toBe(5)
      expect(DEFAULT_ANTI_BAN_SETTINGS.minDelayBetweenPosts).toBe(60)
      expect(DEFAULT_ANTI_BAN_SETTINGS.maxDelayBetweenPosts).toBe(240)
    })
  })

  describe('DEFAULT_NOTIFICATION_SETTINGS', () => {
    it('provides notification defaults', () => {
      expect(DEFAULT_NOTIFICATION_SETTINGS.enableNotifications).toBe(true)
      expect(DEFAULT_NOTIFICATION_SETTINGS.soundEnabled).toBe(true)
      expect(DEFAULT_NOTIFICATION_SETTINGS.notifyOnPostComplete).toBe(true)
      expect(DEFAULT_NOTIFICATION_SETTINGS.notifyOnError).toBe(true)
      expect(DEFAULT_NOTIFICATION_SETTINGS.notifyOnLimitReached).toBe(true)
    })
  })

  describe('DEFAULT_SETTINGS', () => {
    it('combines all default settings', () => {
      expect(DEFAULT_SETTINGS.app).toEqual(DEFAULT_APP_SETTINGS)
      expect(DEFAULT_SETTINGS.antiBan).toEqual(DEFAULT_ANTI_BAN_SETTINGS)
      expect(DEFAULT_SETTINGS.notifications).toEqual(DEFAULT_NOTIFICATION_SETTINGS)
    })
  })
})
