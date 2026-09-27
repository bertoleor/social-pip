// Social-Pip Chrome Extension - Service Worker
// Maneja comunicación con Desktop App via Native Messaging

// Security gate FR-05: every native-host response is zod-validated and clamped
// (see ./nativeHostSchema.ts) so a malicious/corrupt host cannot drive
// arbitrary scheduling or bypass the rate-limit gate via a truthy cast.
import { parseHostBoolean, parseHostDelayMs } from "./nativeHostSchema";
// Security gate FR-07: queue functions are in-memory ONLY (see ./queue.ts) so
// post content/mediaUrls are never written to chrome.storage.local.
import { addTaskToQueue, getTaskQueue, removeTaskFromQueue } from "./queue";
import { tabUrlMatchesTarget } from "./targetVerifier";
import { ALLOWED_WEB_ORIGINS, type ValidatedTask, addTaskMessageSchema } from "./taskSchema";

const NATIVE_HOST = "com.social_pip.app";

interface TaskResult {
  taskId: string;
  success: boolean;
  error?: string;
  postUrl?: string;
  platformPostId?: string;
}

// Task Queue - in-memory ONLY (FR-07). No chrome.storage persistence so post
// content/mediaUrls never land unencrypted on disk. getTaskQueue()/addTaskToQueue()/
// removeTaskFromQueue() are imported from ./queue.ts.

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
        reject(new Error("Native messaging disconnected"));
      });

      port.postMessage(message);

      setTimeout(() => {
        reject(new Error("Native messaging timeout"));
        port.disconnect();
      }, 30000);
    });
  } catch (error) {
    console.error("Failed to send to desktop:", error);
    throw error;
  }
}

// FR-03: profile identification via cookies was REMOVED. detect_current_profile
// used chrome.cookies to read Facebook's session cookie `c_user` (and Instagram
// `sessionid`) and persisted it as `fb_<value>`, turning a session secret into a
// stored profile identifier. No caller invoked it (dead RPC), so removal is
// behavior-preserving; we never persist cookie-derived identifiers.

// FR-06: devolver el tab activo solo si su URL coincide con el destino
// esperado (task.target = grupo/cuenta facebook.com). Se consulta aquí, justo
// antes de sendMessage, para detectar un cambio de pestaña del usuario a mitad
// del dispatch; si no hay target esperado o el tab no coincide, devuelve null
// y la tarea aborta en vez de postear al destino equivocado.
async function getVerifiedTargetTab(task: ValidatedTask): Promise<chrome.tabs.Tab | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return null;

  // Requiere un target explícito y que la URL activa (o su path) coincida con él.
  if (!task.target) return null;
  if (!tab.url) return null;
  return tabUrlMatchesTarget(tab.url, task.target) ? tab : null;
}

// Ejecutar tarea - envía a Desktop para procesar
async function executeTask(task: ValidatedTask): Promise<TaskResult> {
  try {
    // Verificar anti-ban primero. FR-05: el host debe responder un booleano
    // estricto; un valor no-booleano lanza HostResponseError y la tarea aborta
    // (fail-closed) en vez de dejar pasar la acción via truthiness cruda.
    const canPost = parseHostBoolean(
      "check_can_post",
      await sendToDesktop({
        type: "check_can_post",
        platform: task.platform,
        action: task.action,
      }),
    );

    if (!canPost) {
      return {
        taskId: task.id,
        success: false,
        error: "Rate limit exceeded - anti-ban blocking",
      };
    }

    // Obtener delay. FR-05: validar número finito y clampear al rango
    // [MIN_DELAY_MS, MAX_DELAY_MS] para impedir scheduling arbitrario.
    const delay = parseHostDelayMs(
      "get_next_delay",
      await sendToDesktop({
        type: "get_next_delay",
        platform: task.platform,
      }),
    );

    // Enviar comando a content script para ejecutar. FR-06: una tarea encolada
    // NO debe postear a la pestaña activa arbitraria. Exigimos que la URL del
    // tab objetivo coincida con el grupo/cuenta facebook.com esperado (target)
    // y volvemos a verificar inmediatamente antes de sendMessage; si el usuario
    // cambió de pestaña o el tab ya no coincide, abortamos.
    const tab = await getVerifiedTargetTab(task);
    const tabId = tab?.id;
    if (!tabId) {
      return {
        taskId: task.id,
        success: false,
        error: "No valid target tab (tab URL does not match task.target)",
      };
    }

    // Enviar a content script para ejecutar la acción
    const result = await chrome.tabs.sendMessage(tabId, {
      action: task.action,
      content: task.content,
      mediaUrls: task.mediaUrls,
      target: task.target,
    });

    // Registrar acción en anti-ban engine
    await sendToDesktop({
      type: "record_post_action",
      platform: task.platform,
      action: task.action,
      success: result.success,
      delay_used_ms: delay,
    });

    return {
      taskId: task.id,
      success: result.success,
      postUrl: result.postUrl,
      platformPostId: result.platformPostId,
    };
  } catch (error) {
    return {
      taskId: task.id,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Processar cola de tareas
async function processTaskQueue(): Promise<void> {
  const queue = getTaskQueue();

  if (queue.length === 0) {
    return;
  }

  const task = queue[0];

  if (!task) {
    return;
  }

  // Obtener delay antes de ejecutar. FR-05: validar y clampear.
  const delay = parseHostDelayMs(
    "get_next_delay",
    await sendToDesktop({
      type: "get_next_delay",
      platform: task.platform,
    }),
  );

  // Esperar el delay
  await new Promise((resolve) => setTimeout(resolve, delay));

  // Verificar si debe hacer break. FR-05: booleano estricto, no truthiness.
  const shouldBreak = parseHostBoolean(
    "should_break",
    await sendToDesktop({
      type: "should_break",
      platform: task.platform,
    }),
  );

  if (shouldBreak) {
    console.log("Taking batch break...");
    await new Promise((resolve) => setTimeout(resolve, 20 * 60 * 1000)); // 20 min break
  }

  // Ejecutar tarea
  const result = await executeTask(task);

  // Remover de cola (in-memory, FR-07)
  removeTaskFromQueue(task.id);

  // Notificar resultado
  await sendToDesktop({
    type: "task_result",
    result,
  });

  // Continuar con siguiente tarea
  if (getTaskQueue().length > 0) {
    processTaskQueue();
  }
}

// Event Listeners

// ---------------------------------------------------------------------------
// Sender trust gate (FR-01). chrome.runtime.onMessage only delivers messages
// from extension contexts (popup, content scripts, extension pages) — never
// directly from a web page — but a page can still influence the content
// script's isolated world. We therefore require, for EVERY message:
//   - sender.id === chrome.runtime.id  (message truly originated from this
//     extension's own origin, not a foreign/undefined sender)
//   - sender.url is our own extension page OR an allowed web origin
//     (matches host_permissions: facebook.com), so a message can only be
//     injected from a context we deliberately ship to.
// ---------------------------------------------------------------------------
function isTrustedSender(sender: chrome.runtime.MessageSender): boolean {
  if (!sender || sender.id !== chrome.runtime.id) {
    return false;
  }
  if (!sender.url) {
    return false;
  }
  if (sender.url.startsWith("chrome-extension://")) {
    return true; // our own popup / extension page
  }
  try {
    const host = new URL(sender.url).host;
    return ALLOWED_WEB_ORIGINS.includes(host as (typeof ALLOWED_WEB_ORIGINS)[number]);
  } catch {
    return false;
  }
}

async function handleRuntimeMessage(
  message: unknown,
  sender: chrome.runtime.MessageSender,
): Promise<unknown> {
  if (!isTrustedSender(sender)) {
    return { success: false, error: "untrusted_message_sender" };
  }
  if (!message || typeof message !== "object") {
    return { success: false, error: "invalid_message" };
  }

  const type = (message as { type?: unknown }).type;
  switch (type) {
    case "add_task": {
      // Zod-enforce the whole payload (platform/action allowlist, bounded
      // content, http(s)-only mediaUrls, strict shape) before it can be
      // queued and later dispatched to the active tab.
      const parsed = addTaskMessageSchema.safeParse(message);
      if (!parsed.success) {
        console.warn("add_task rejected:", parsed.error.flatten());
        return { success: false, error: "invalid_task_payload" };
      }
      const queued = addTaskToQueue(parsed.data.task);
      if (!queued) {
        return { success: false, error: "queue_full" };
      }
      processTaskQueue();
      return { success: true };
    }

    case "get_status": {
      const queue = getTaskQueue();
      return { queueLength: queue.length };
    }

    case "ping": {
      // FR-09: report real native host reachability instead of always echoing
      // success. The desktop host (run_native_messaging_mode) answers a Ping
      // with Pong { pong: true }; anything else (host not installed, app not
      // running, timeout) means the popup should show "disconnected".
      try {
        const pong = (await sendToDesktop({ type: "ping" })) as { pong?: boolean } | undefined;
        return { success: pong?.pong === true };
      } catch {
        return { success: false };
      }
    }

    case "open_app": {
      // FR-09: launching the native app is equivalent to connecting to the
      // native messaging host (which spawns/wakes the desktop app binary
      // registered for com.social_pip.app). Report success only when the host
      // actually responds, mirroring the popup dashboard button.
      try {
        const pong = (await sendToDesktop({ type: "ping" })) as { pong?: boolean } | undefined;
        return { success: pong?.pong === true };
      } catch {
        return { success: false };
      }
    }

    default:
      return undefined;
  }
}

// Message handler - recibe mensajes de content scripts y popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleRuntimeMessage(message, sender)
    .then((response) => {
      sendResponse(response);
    })
    .catch((error) => {
      console.error("Message handler error:", error);
      sendResponse({ success: false, error: "internal_error" });
    });
  return true; // keep the message channel open for the async response
});

// Install/update handler
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("Social-Pip Extension installed");

    // FR-03/FR-07: nothing sensitive is written to storage on install. The task
    // queue is in-memory only and no cookie-derived profile identifier is kept.
  }
});

// Startup handler
chrome.runtime.onStartup.addListener(() => {
  console.log("Social-Pip Extension starting");
  processTaskQueue();
});

console.log("Social-Pip Service Worker initialized");
