export type BrowserTaskType = 'post' | 'scrape' | 'validate' | 'cleanup'

export interface TaskResult {
  success: boolean
  data?: unknown
  error?: string
}

export interface BrowserTask {
  id: string
  type: BrowserTaskType
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  createdAt: Date
  updatedAt: Date
  payload: unknown
  result?: TaskResult
  error?: string
}

export interface CreateBrowserTaskInput {
  type: BrowserTaskType
  payload: unknown
}

export interface BrowserTaskFilter {
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  type?: BrowserTaskType
}
