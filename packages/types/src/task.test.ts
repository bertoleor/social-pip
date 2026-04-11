import { describe, it, expect } from 'vitest'
import type {
  BrowserTaskType,
  TaskResult,
  BrowserTask,
  CreateBrowserTaskInput,
  BrowserTaskFilter,
} from './task'

describe('task types', () => {
  describe('BrowserTaskType', () => {
    it('accepts valid task types', () => {
      const validTypes: BrowserTaskType[] = ['post', 'scrape', 'validate', 'cleanup']

      validTypes.forEach((type) => {
        const taskType: BrowserTaskType = type
        expect(taskType).toBeDefined()
      })
    })
  })

  describe('TaskResult', () => {
    it('creates successful result without data', () => {
      const result: TaskResult = {
        success: true,
      }

      expect(result.success).toBe(true)
      expect(result.data).toBeUndefined()
      expect(result.error).toBeUndefined()
    })

    it('creates successful result with data', () => {
      const result: TaskResult = {
        success: true,
        data: { postId: '123', url: 'https://example.com' },
      }

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    it('creates failed result with error', () => {
      const result: TaskResult = {
        success: false,
        error: 'Network timeout',
      }

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network timeout')
    })
  })

  describe('BrowserTask', () => {
    it('creates a complete task object', () => {
      const now = new Date()
      const task: BrowserTask = {
        id: 'task_123',
        type: 'post',
        status: 'pending',
        createdAt: now,
        updatedAt: now,
        payload: { content: 'Test post' },
      }

      expect(task.id).toBe('task_123')
      expect(task.type).toBe('post')
      expect(task.status).toBe('pending')
      expect(task.payload).toEqual({ content: 'Test post' })
      expect(task.result).toBeUndefined()
      expect(task.error).toBeUndefined()
    })

    it('creates task with result', () => {
      const now = new Date()
      const task: BrowserTask = {
        id: 'task_456',
        type: 'scrape',
        status: 'completed',
        createdAt: now,
        updatedAt: now,
        payload: { url: 'https://example.com' },
        result: {
          success: true,
          data: { title: 'Example' },
        },
      }

      expect(task.status).toBe('completed')
      expect(task.result?.success).toBe(true)
      expect(task.result?.data).toEqual({ title: 'Example' })
    })

    it('creates failed task with error', () => {
      const now = new Date()
      const task: BrowserTask = {
        id: 'task_789',
        type: 'validate',
        status: 'failed',
        createdAt: now,
        updatedAt: now,
        payload: { accountId: 'acc_123' },
        error: 'Account not found',
      }

      expect(task.status).toBe('failed')
      expect(task.error).toBe('Account not found')
    })

    it('supports all status values', () => {
      const statuses: Array<BrowserTask['status']> = [
        'pending',
        'running',
        'completed',
        'failed',
        'cancelled',
      ]

      statuses.forEach((status) => {
        const task: BrowserTask = {
          id: 'task_test',
          type: 'post',
          status,
          createdAt: new Date(),
          updatedAt: new Date(),
          payload: {},
        }
        expect(task.status).toBe(status)
      })
    })
  })

  describe('CreateBrowserTaskInput', () => {
    it('creates input with minimal fields', () => {
      const input: CreateBrowserTaskInput = {
        type: 'post',
        payload: { content: 'Test' },
      }

      expect(input.type).toBe('post')
      expect(input.payload).toEqual({ content: 'Test' })
    })

    it('creates scrape task input', () => {
      const input: CreateBrowserTaskInput = {
        type: 'scrape',
        payload: { url: 'https://facebook.com/group/123' },
      }

      expect(input.type).toBe('scrape')
    })

    it('creates validate task input', () => {
      const input: CreateBrowserTaskInput = {
        type: 'validate',
        payload: { accountId: 'acc_123' },
      }

      expect(input.type).toBe('validate')
    })

    it('creates cleanup task input', () => {
      const input: CreateBrowserTaskInput = {
        type: 'cleanup',
        payload: { olderThan: '2024-01-01' },
      }

      expect(input.type).toBe('cleanup')
    })
  })

  describe('BrowserTaskFilter', () => {
    it('creates empty filter', () => {
      const filter: BrowserTaskFilter = {}

      expect(filter.status).toBeUndefined()
      expect(filter.type).toBeUndefined()
    })

    it('creates filter with status', () => {
      const filter: BrowserTaskFilter = {
        status: 'running',
      }

      expect(filter.status).toBe('running')
    })

    it('creates filter with type', () => {
      const filter: BrowserTaskFilter = {
        type: 'scrape',
      }

      expect(filter.type).toBe('scrape')
    })

    it('creates filter with both status and type', () => {
      const filter: BrowserTaskFilter = {
        status: 'pending',
        type: 'post',
      }

      expect(filter.status).toBe('pending')
      expect(filter.type).toBe('post')
    })
  })
})
