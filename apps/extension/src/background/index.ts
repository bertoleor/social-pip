// Social-Pip Chrome Extension - Service Worker
// Maneja comunicación con Desktop App via Native Messaging

const NATIVE_HOST = 'com.social_pip.app';
const TASK_QUEUE_KEY = 'socialpip_task_queue';
const ACCOUNT_PROFILE_KEY = 'socialpip_current_profile';

interface TaskMessage {
  id: string;
  type: string;
  platform: string;
  action: string;
  content?: string;
  mediaUrls?: string[];
  target?: string;
  accountId: string;
  timestamp: number;
}

interface TaskResult {
  taskId: string;
  success: boolean;
  error?: string;
  postUrl?: string;
  platformPostId?: string;
}

// Task Queue - persiste en storage
async function getTaskQueue(): Promise<TaskMessage[]> {
  const result = await chrome.storage.local.get(TASK_QUEUE_KEY);
  return result[TASK_QUEUE_KEY] || [];
}

async function addTaskToQueue(task: TaskMessage): Promise<void> {
  const queue = await getTaskQueue();
  queue.push(task);
  await chrome.storage.local.set({ [TASK_QUEUE_KEY]: queue });
}

async function removeTaskFromQueue(taskId: string): Promise<void> {
  const queue = await getTaskQueue();
  const filtered = queue.filter(t => t.id !== taskId);
  await chrome.storage.local.set({ [TASK_QUEUE_KEY]: filtered });
}

// Native Messaging - comunicación con Desktop App
async function sendToDesktop(message: object): Promise<unknown> {
  try {
    const port = chrome.runtime.connectNative(NATIVE_HOST);
    
    return new Promise((resolve, reject) => {
      port.onMessage.addListener((response) => {
        resolve(response);
        port.disconnect();
      });
      
      port.onDisconnect.addListener(() => {
        reject(new Error('Native messaging disconnected'));
      });
      
      port.postMessage(message);
      
      setTimeout(() => {
        reject(new Error('Native messaging timeout'));
        port.disconnect();
      }, 30000);
    });
  } catch (error) {
    console.error('Failed to send to desktop:', error);
    throw error;
  }
}

// Detectar perfil actual via cookies
async function detectCurrentProfile(): Promise<string | null> {
  try {
    const facebookCookies = await chrome.cookies.getAll({ 
      url: 'https://www.facebook.com',
      name: 'c_user'
    });
    
    if (facebookCookies.length > 0) {
      return `fb_${facebookCookies[0].value}`;
    }

    const instagramCookies = await chrome.cookies.getAll({
      url: 'https://www.instagram.com',
      name: 'sessionid'
    });

    if (instagramCookies.length > 0) {
      return `ig_${instagramCookies[0].value.substring(0, 20)}`;
    }

    return null;
  } catch (error) {
    console.error('Failed to detect profile:', error);
    return null;
  }
}

// Ejecutar tarea - envía a Desktop para procesar
async function executeTask(task: TaskMessage): Promise<TaskResult> {
  try {
    // Verificar anti-ban primero
    const canPost = await sendToDesktop({
      type: 'check_can_post',
      platform: task.platform,
      action: task.action
    });

    if (!canPost) {
      return {
        taskId: task.id,
        success: false,
        error: 'Rate limit exceeded - anti-ban blocking'
      };
    }

    // Obtener delay
    const delay = await sendToDesktop({
      type: 'get_next_delay',
      platform: task.platform
    }) as number;

    // Enviar comando a content script para ejecutar
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.id) {
      return {
        taskId: task.id,
        success: false,
        error: 'No active tab'
      };
    }

    // Enviar a content script para ejecutar la acción
    const result = await chrome.tabs.sendMessage(tab.id, {
      action: task.action,
      content: task.content,
      mediaUrls: task.mediaUrls,
      target: task.target
    });

    // Registrar acción en anti-ban engine
    await sendToDesktop({
      type: 'record_post_action',
      platform: task.platform,
      action: task.action,
      success: result.success,
      delay_used_ms: delay
    });

    return {
      taskId: task.id,
      success: result.success,
      postUrl: result.postUrl,
      platformPostId: result.platformPostId
    };
  } catch (error) {
    return {
      taskId: task.id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Processar cola de tareas
async function processTaskQueue(): Promise<void> {
  const queue = await getTaskQueue();
  
  if (queue.length === 0) {
    return;
  }

  const task = queue[0];
  
  // Obtener delay antes de ejecutar
  const delay = await sendToDesktop({
    type: 'get_next_delay',
    platform: task.platform
  }) as number;

  // Esperar el delay
  await new Promise(resolve => setTimeout(resolve, delay));

  // Verificar si debe hacer break
  const shouldBreak = await sendToDesktop({
    type: 'should_break',
    platform: task.platform
  }) as boolean;

  if (shouldBreak) {
    console.log('Taking batch break...');
    await new Promise(resolve => setTimeout(resolve, 20 * 60 * 1000)); // 20 min break
  }

  // Ejecutar tarea
  const result = await executeTask(task);
  
  // Remover de cola
  await removeTaskFromQueue(task.id);

  // Notificar resultado
  await sendToDesktop({
    type: 'task_result',
    result
  });

  // Continuar con siguiente tarea
  if ((await getTaskQueue()).length > 0) {
    processTaskQueue();
  }
}

// Event Listeners

// Message handler - recibe mensajes de content scripts y popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'add_task') {
    addTaskToQueue(message.task).then(() => {
      sendResponse({ success: true });
      processTaskQueue();
    });
    return true;
  }

  if (message.type === 'get_status') {
    getTaskQueue().then(queue => {
      sendResponse({ queueLength: queue.length });
    });
    return true;
  }

  if (message.type === 'detect_profile') {
    detectCurrentProfile().then(profile => {
      sendResponse({ profile });
    });
    return true;
  }

  return false;
});

// Install/update handler
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Social-Pip Extension installed');
    
    chrome.storage.local.set({
      [TASK_QUEUE_KEY]: [],
      [ACCOUNT_PROFILE_KEY]: null
    });
  }
});

// Startup handler
chrome.runtime.onStartup.addListener(() => {
  console.log('Social-Pip Extension starting');
  processTaskQueue();
});

console.log('Social-Pip Service Worker initialized');