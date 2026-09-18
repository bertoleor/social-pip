// Social-Pip - Facebook Content Script
// Automatización de Facebook Groups con anti-ban

interface PostAction {
  action: string;
  content?: string;
  mediaUrls?: string[];
  target?: string;
}

interface PostResult {
  success: boolean;
  postUrl?: string;
  platformPostId?: string;
  error?: string;
}

// Authz gate (FR-08): only runtime messages that originate from our own
// extension (sender.id === runtime.id) AND from a Facebook tab (sender.url
// matches facebook.com) may drive actions in this content script. A page
// context inyectado/comprometido that calls chrome.runtime.onMessage can only
// reach this listener as an external sendMessage, which lacks our extension id
// (and, if it had it, still would not match facebook.com unless the tab is
// Facebook — the only context this script runs in). plus we refuse any action
// outside the explicit allowlist.
const FB_URL_RE = /^https?:\/\/([a-z0-9-]+\.)*facebook\.com(\/|$)/i;

const ALLOWED_ACTIONS = ["post_group", "execute_post", "check_status"] as const;

type AllowedAction = (typeof ALLOWED_ACTIONS)[number];

function isTrustedSender(sender: chrome.runtime.MessageSender): boolean {
  if (!sender.url) return false;
  try {
    if (!FB_URL_RE.test(sender.url)) return false;
  } catch {
    return false;
  }
  return sender.id === chrome.runtime.id;
}

function isAllowedAction(action: unknown): action is AllowedAction {
  return typeof action === "string" && (ALLOWED_ACTIONS as readonly string[]).includes(action);
}

function unauthorizedResponse(): PostResult {
  return { success: false, error: "Unauthorized message sender" };
}

// Selectores para Facebook Groups (actualizados Abril 2026)
const SELECTORS = {
  // Post composer
  composer: '[role="combobox"][aria-label*="Qué estás pensando"]',
  composerFallback: 'div[aria-label*="Crear publicación"]',
  textArea: '[role="textbox"][aria-label*="Qué estás pensando"]',

  // Botones
  postButton: 'div[aria-label*="Publicar"][role="button"]',
  postButtonFallback: 'div[data-testid="fbfeed story"]',
  attachMediaButton: 'div[aria-label*="Foto/video"][role="button"]',

  // Grupos
  groupPostArea: 'div[aria-label*="Escribí algo en este grupo"]',
  groupPostAreaAlt: '[data-testid="fbfeed story"]',

  // Rate limit warning
  rateLimitWarning: 'div:contains("limitamos")',
  rateLimitWarningAlt: 'div:contains("We limit how often")',
};

// Helper: esperar elemento
async function waitForSelector(selector: string, timeout = 5000): Promise<Element | null> {
  const element = document.querySelector(selector);
  if (element) return element;

  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

// Helper: delay aleatorio
function randomDelay(min: number, max: number): Promise<void> {
  const delay = Math.random() * (max - min) + min;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

// Helper: typing humano
async function humanType(element: Element, text: string): Promise<void> {
  const chars = text.split("");

  for (const char of chars) {
    (element as HTMLInputElement).value += char;
    element.dispatchEvent(new Event("input", { bubbles: true }));

    // Delay variable entre caracteres
    const charDelay = Math.random() * 50 + 30;
    await new Promise((resolve) => setTimeout(resolve, charDelay));

    // Pausa extra en puntuación
    if ([".", ",", "!", "?", "\n"].includes(char)) {
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 200 + 100));
    }
  }
}

// Helper: scroll humano
async function humanScroll(times = 3): Promise<void> {
  for (let i = 0; i < times; i++) {
    const scrollAmount = Math.random() * 300 + 200;
    window.scrollBy({
      top: Math.random() > 0.5 ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
    await randomDelay(500, 1500);
  }
}

// Publicar en Grupo
async function postToGroup(content: string, _groupUrl?: string): Promise<PostResult> {
  try {
    // Scroll antes de action (anti-ban)
    await humanScroll(2);
    await randomDelay(1000, 2000);

    // Buscar área de publicación
    let composerArea = await waitForSelector(SELECTORS.composer);

    if (!composerArea) {
      composerArea = await waitForSelector(SELECTORS.groupPostArea);
    }

    if (!composerArea) {
      // Buscar el botón de crear publicación
      const createBtn = Array.from(document.querySelectorAll('div[role="button"]')).find(
        (el) => el.textContent?.includes("Publicación") || el.textContent?.includes("Create post"),
      );

      if (createBtn) {
        (createBtn as HTMLElement).click();
        await randomDelay(1000, 2000);
      } else {
        return { success: false, error: "No se encontró el composer" };
      }
    }

    // Ahora buscar el textarea
    const textArea = await waitForSelector(SELECTORS.textArea);

    if (!textArea) {
      return { success: false, error: "No se encontró el área de texto" };
    }

    // Click y typing humano
    (textArea as HTMLElement).click();
    await randomDelay(500, 1000);

    await humanType(textArea, content);

    // Buscar y clickear botón de publicar
    await randomDelay(1000, 2000);

    const postButton = await waitForSelector(SELECTORS.postButton);

    if (postButton) {
      (postButton as HTMLElement).click();
      await randomDelay(2000, 4000);

      // Verificar si hubo rate limit
      const rateLimit =
        document.body.textContent?.includes("limitamos") ||
        document.body.textContent?.includes("We limit");

      if (rateLimit) {
        return { success: false, error: "Rate limit detectado" };
      }

      // Obtener URL del post (si es posible)
      const postUrl = window.location.href;

      return { success: true, postUrl };
    }

    return { success: false, error: "No se encontró botón de publicar" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Publicar con medios
async function postWithMedia(content: string, mediaUrls: string[]): Promise<PostResult> {
  try {
    await humanScroll(2);
    await randomDelay(1000, 2000);

    const composerArea =
      (await waitForSelector(SELECTORS.composer)) ??
      (await waitForSelector(SELECTORS.groupPostArea));

    if (!composerArea) {
      const createBtn = Array.from(document.querySelectorAll('div[role="button"]')).find(
        (el) => el.textContent?.includes("Publicación") || el.textContent?.includes("Create post"),
      );

      if (createBtn) {
        (createBtn as HTMLElement).click();
        await randomDelay(1000, 2000);
      } else {
        return { success: false, error: "No se encontró el composer" };
      }
    }

    const textArea = await waitForSelector(SELECTORS.textArea);
    if (!textArea) {
      return { success: false, error: "No se encontró el área de texto" };
    }

    (textArea as HTMLElement).click();
    await randomDelay(500, 1000);
    await humanType(textArea, content);
    await randomDelay(500, 1000);

    for (let i = 0; i < mediaUrls.length; i++) {
      const mediaUrl = mediaUrls[i];
      if (!mediaUrl) continue;
      const attachBtn = await waitForSelector(SELECTORS.attachMediaButton);
      if (!attachBtn) {
        return { success: false, error: "No se encontró botón de adjuntar media" };
      }

      (attachBtn as HTMLElement).click();
      await randomDelay(1000, 2000);

      const fileInput = document.querySelector(
        'input[type="file"][accept*="image"]',
      ) as HTMLInputElement;
      if (!fileInput) {
        const allFileInputs = document.querySelectorAll('input[type="file"]');
        const imageInput = Array.from(allFileInputs).find(
          (input) =>
            (input as HTMLInputElement).accept?.includes("image") ||
            (input as HTMLInputElement).accept?.includes("*"),
        );
        if (!imageInput) {
          return { success: false, error: "No se encontró input de archivo" };
        }
        imageInput.setAttribute("data-testid", "media-file-input");
      }

      const fileInputEl = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (!fileInputEl) {
        return { success: false, error: "No se pudo acceder al input de archivo" };
      }

      const dataTransfer = new DataTransfer();

      try {
        const response = await fetch(mediaUrl);
        const blob = await response.blob();
        const fileName = mediaUrl.split("/").pop() ?? `image_${i}.jpg`;
        const file = new File([blob], fileName, { type: blob.type || "image/jpeg" });
        dataTransfer.items.add(file);
      } catch {
        return { success: false, error: `No se pudo descargar imagen ${i + 1}` };
      }

      fileInputEl.files = dataTransfer.files;
      fileInputEl.dispatchEvent(new Event("change", { bubbles: true }));
      fileInputEl.dispatchEvent(new Event("input", { bubbles: true }));

      await randomDelay(3000, 6000);

      const uploadProgress =
        document.querySelector('[aria-label*="Subiendo"]') ??
        document.querySelector('[aria-label*="Uploading"]');

      if (uploadProgress) {
        await randomDelay(3000, 5000);
      }

      const uploadError =
        document.querySelector('[aria-label*="error"]') ??
        document.body.textContent?.includes("error al subir");

      if (uploadError) {
        return { success: false, error: "Error subiendo imagen" };
      }
    }

    await randomDelay(1000, 2000);

    const postButton = await waitForSelector(SELECTORS.postButton);
    if (postButton) {
      (postButton as HTMLElement).click();
      await randomDelay(2000, 4000);

      const rateLimit =
        document.body.textContent?.includes("limitamos") ||
        document.body.textContent?.includes("We limit");

      if (rateLimit) {
        return { success: false, error: "Rate limit detectado" };
      }

      const postUrl = window.location.href;
      return { success: true, postUrl };
    }

    return { success: false, error: "No se encontró botón de publicar" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Detectar si estamos en un grupo
function isInGroup(): boolean {
  return window.location.pathname.includes("/groups/");
}

// Detectar rate limit
function checkRateLimit(): boolean {
  const bodyText = document.body.innerText.toLowerCase();
  return (
    bodyText.includes("limitamos") ||
    bodyText.includes("we limit") ||
    bodyText.includes("temporalmente restringido")
  );
}

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // FR-08 authz gate: reject any message that is not from our own extension
  // running on a Facebook tab, or whose action is not explicitly allowed.
  if (!isTrustedSender(sender)) {
    sendResponse(unauthorizedResponse());
    return true;
  }

  const { action, content, mediaUrls, target } = message as PostAction;

  if (!isAllowedAction(action)) {
    sendResponse(unauthorizedResponse());
    return true;
  }

  if (action === "post_group") {
    if (!isInGroup()) {
      sendResponse({ success: false, error: "No estás en un grupo de Facebook" });
      return true;
    }

    if (checkRateLimit()) {
      sendResponse({ success: false, error: "Rate limit activo - espera 24-72 horas" });
      return true;
    }

    if (mediaUrls && mediaUrls.length > 0) {
      postWithMedia(content || "", mediaUrls).then(sendResponse);
    } else {
      postToGroup(content || "", target).then(sendResponse);
    }

    return true;
  }

  if (action === "check_status") {
    sendResponse({
      isInGroup: isInGroup(),
      hasRateLimit: checkRateLimit(),
      url: window.location.href,
    });
    return true;
  }

  // E3.2: New execute_post action handler for Facebook E2E posting
  if (action === "execute_post") {
    try {
      // E3.4: Check if we're on a Facebook group page
      if (!isInGroup()) {
        sendResponse({
          success: false,
          error: "Facebook composer not found on page. Make sure you are on a Facebook group page.",
        });
        return true;
      }

      // E3.4: Verify composer is available before attempting to post
      const hasComposer =
        document.querySelector(SELECTORS.composer) !== null ||
        document.querySelector(SELECTORS.groupPostArea) !== null ||
        Array.from(document.querySelectorAll('div[role="button"]')).some(
          (el) =>
            el.textContent?.includes("Publicación") || el.textContent?.includes("Create post"),
        );

      if (!hasComposer) {
        sendResponse({
          success: false,
          error: "Facebook composer not found on page. Make sure you are on a Facebook group page.",
        });
        return true;
      }

      // Check rate limit before posting
      if (checkRateLimit()) {
        sendResponse({
          success: false,
          error: "Rate limit activo - espera 24-72 horas",
        });
        return true;
      }

      const { content, mediaUrls, target } = message as PostAction;

      // Execute post with or without media
      if (mediaUrls && mediaUrls.length > 0) {
        postWithMedia(content ?? "", mediaUrls)
          .then((result) => {
            sendResponse(result);
          })
          .catch((error) => {
            sendResponse({
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          });
      } else {
        postToGroup(content ?? "", target)
          .then((result) => {
            sendResponse(result);
          })
          .catch((error) => {
            sendResponse({
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          });
      }

      return true; // Keep message channel open for async response
    } catch (error) {
      // E3.4: Catch any unexpected errors
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return true;
    }
  }

  return false;
});

console.log("Social-Pip Facebook content script loaded");
