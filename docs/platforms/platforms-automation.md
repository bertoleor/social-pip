# Automatización de Plataformas - Social-Pip
> Parte de: [[README]]

## ⚠️ Nota Importante

**Los ejemplos de código en este documento son referencia conceptual en TypeScript.**

La implementación real de automatización se hace via **Chrome Extension MV3** (Content Scripts) ejecutados en el browser del usuario:
- Los ejemplos TypeScript muestran la **lógica de negocio** y estructura
- La **implementación real** está en `apps/extension/src/content/[plataforma]/`
- Los content scripts usan **JavaScript** para manipular el DOM directamente
- El backend de Rust en Tauri maneja scheduling, anti-ban engine y base de datos

### Estructura de Implementación

```
apps/extension/src/content/
├── facebook/
│   ├── groups.ts      # Posting en grupos
│   ├── marketplace.ts # Listings
│   └── selectors.ts   # CSS selectors (actualizados 2026)
├── instagram/
│   ├── feed.ts
│   └── stories.ts
└── ...
```

### CSS Selectors

Cada plataforma tiene su propio archivo de `selectors.ts` que contiene los **CSS selectors actualizados para 2026**. Esto es crítico porque las plataformas cambian frecuentemente su estructura DOM.

**Por qué selectors.ts es independiente:**

```typescript
// apps/extension/src/content/facebook/selectors.ts
export const FacebookSelectors = {
  // Botón de publicar
  postButton: '[data-testid="react-composer-post-button"]',
  // Input de texto
  textArea: '[data-testid="story-editor-input"]',
  // Selector de grupo
  groupPostArea: '[role="textbox"][aria-label*="Write something"]',
  // Marketplace
  marketplaceListing: '[data-pagelet="MarketplaceNux"]',
  // Botón de imagen
  addMediaButton: '[data-testid="media-attachment-photo"]',
} as const;

// apps/extension/src/content/twitter/selectors.ts  
export const TwitterSelectors = {
  tweetInput: '[data-testid="tweetTextInput"]',
  tweetButton: '[data-testid="tweetButton"]',
  uploadButton: '[data-testid="fileUpload"]',
  // 2026: X cambió muchos data-testid
  replyInput: '[data-testid="reply"]',
} as const;
```

**Actualización de selectors:** Los selectors se actualizan manualmente revisando el DOM de cada plataforma. Se recomienda revisar cada 1-2 meses o cuando la automatización falle.

**Estrategia de fallback:** Si un selector falla, la implementación debe tener selectors alternativos:</p>

## Visión General

Social-Pip soporta múltiples plataformas de redes sociales. Cada plataforma tiene:
- **Content Script** en la extensión para automatización del browser
- **Configuración anti-ban** en el motor de Rust
- **Delays configurables** por plataforma

---

## Plataformas Soportadas

| Plataforma | Método | Alternativa Free | Repo/Library |
|------------|--------|------------------|---------------|
| **Twitter/X** | Twikit (cookies) | ✅ | d60/twikit (4.3k stars) |
| **Facebook** | Graph API + Browser | ✅ | Graph API |
| **Instagram** | instagrapi + Graph API | ✅ | divoc/instagrapi |
| **TikTok** | Phantomwright (browser) | ✅ | haziq-exe/TikTokAutoUploader |
| **LinkedIn** | Playwright automation | ✅ | AbdullahRao25/LinkedIn-Stealth-Outreach |
| **Threads** | API oficial Meta | ✅ | Graph API (FREE) |
| **Telegram** | Bot API | ✅ | python-telegram-bot (29k stars) |
| **WhatsApp** | Baileys | ✅ | WhiskeySockets/Baileys (8.9k stars) |

---

## 1. Twitter/X - Twikit

### Características

- **Sin API key** - Usa session cookies
- **Gratis** - Sin costo de API
- **Rate limits**: 50 search/15min, 15 follow/15min

### Código

```typescript
// src/modules/platform/twitter/twitter.adapter.ts
import { Client } from 'twikit';

export class TwitterAdapter {
  private client: Client;
  private cookiesPath: string;

  async login(username: string, password: string): Promise<void> {
    this.client = new Client('es-ES');
    await this.client.login(
      auth_info_1=username,
      auth_info_2=`${username}@email.com`,
      password=password,
      cookies_file=this.cookiesPath
    );
  }

  async createTweet(content: string): Promise<string> {
    const tweet = await this.client.create_tweet(content);
    return tweet.id;
  }

  async createThread(tweets: string[]): Promise<string[]> {
    const ids: string[] = [];
    let previousId: string | undefined;
    
    for (const content of tweets) {
      const tweet = await this.client.create_tweet(content, {
        reply_to: previousId
      });
      ids.push(tweet.id);
      previousId = tweet.id;
    }
    
    return ids;
  }

  async uploadMedia(filePath: string): Promise<string> {
    return this.client.upload_media(filePath);
  }

  async close(): Promise<void> {
    // Guardar cookies para próxima sesión
  }
}
```

### Anti-Ban

```typescript
// src/modules/platform/twitter/twitter-anti-ban.ts
export class TwitterAntiBan {
  private minDelay = 1000; // 1 segundo
  private maxDelay = 3000; // 3 segundos

  async applyDelay(): Promise<void> {
    const delay = Math.random() * (this.maxDelay - this.minDelay) + this.minDelay;
    await this.sleep(delay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // No hacer login() repetidamente - usar cookies persistentes
  // 1-3 segundos entre requests
  // Respetar rate limits
}
```

---

## 2. Threads - API Meta

### Características

- **API oficial** - Meta Graph API
- **Gratis** - 250 posts/día
- **OAuth 2.0** - Autenticación estándar

### Código

```typescript
// src/modules/platform/threads/threads.adapter.ts
import { Meta } from '@fluxon/meta';

export class ThreadsAdapter {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async createPost(content: string): Promise<string> {
    const response = await fetch('https://graph.threads.net/v1.0/me/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: content
      })
    });

    const data = await response.json();
    return data.id;
  }

  async createMediaPost(imageUrl: string, caption: string): Promise<string> {
    // 1. Crear container
    const container = await this.createMediaContainer(imageUrl);
    
    // 2. Publicar
    const response = await fetch('https://graph.threads.net/v1.0/me/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: caption,
        image_id: container.id
      })
    });

    return (await response.json()).id;
  }

  private async createMediaContainer(imageUrl: string) {
    const response = await fetch(
      `https://graph.threads.net/v1.0/me/media?image_url=${encodeURIComponent(imageUrl)}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      }
    );
    return response.json();
  }
}
```

### Documentación

- https://developers.facebook.com/docs/threads/
- https://developers.facebook.com/docs/threads/overview/

---

## 3. Telegram - Bot API

### Características

- **Bot API oficial** - Gratuito
- **30 msg/s** - Rate limit
- **Sin necesidad de cuenta personal**

### Código

```typescript
// src/modules/platform/telegram/telegram.adapter.ts
import { Bot } from 'grammy';

export class TelegramAdapter {
  private bot: Bot;

  constructor(token: string) {
    this.bot = new Bot(token);
  }

  async sendMessage(chatId: string, text: string): Promise<number> {
    const message = await this.bot.api.sendMessage(chatId, text);
    return message.message_id;
  }

  async sendMedia(chatId: string, media: string, caption?: string): Promise<number> {
    if (media.endsWith('.jpg') || media.endsWith('.png')) {
      const message = await this.bot.api.sendPhoto(chatId, media, { caption });
      return message.message_id;
    }
    if (media.endsWith('.mp4')) {
      const message = await this.bot.api.sendVideo(chatId, media, { caption });
      return message.message_id;
    }
    throw new Error('Unsupported media type');
  }

  async sendWithButtons(chatId: string, text: string, buttons: InlineKeyboardButton[][]): Promise<number> {
    const message = await this.bot.api.sendMessage(chatId, text, {
      reply_markup: { inline_keyboard: buttons }
    });
    return message.message_id;
  }
}
```

### Documentación

- https://core.telegram.org/bots/api

---

## 4. WhatsApp - Baileys

### Características

- **Gratis** - Sin API oficial
- **Medio riesgo** - Puede banear
- **Requires VPS** - Para mantener corriendo

### Código

```typescript
// src/modules/platform/whatsapp/whatsapp.adapter.ts
import { makeWASocket, useMultiFileAuthState } from '@baileys';

export class WhatsAppAdapter {
  private sock: any;
  private jid: string;

  async connect(): Promise<void> {
    const { state, saveCreds } = await useMultiFileAuthState('./auth/whatsapp');
    
    this.sock = makeWASocket({
      printQR: true,
      auth: state,
      browser: ['Chrome', 'Chrome', '120.0']
    });

    this.sock.ev.on('creds.update', saveCreds);
  }

  async sendMessage(number: string, message: string): Promise<void> {
    const jid = `${number}@s.whatsapp.net`;
    await this.sock.sendMessage(jid, { text: message });
  }

  async sendMedia(number: string, imageUrl: string, caption?: string): Promise<void> {
    const jid = `${number}@s.whatsapp.net`;
    await this.sock.sendMessage(jid, {
      image: { url: imageUrl },
      caption
    });
  }
}
```

### Anti-Ban

```typescript
// src/modules/platform/whatsapp/whatsapp-anti-ban.ts
export class WhatsAppAntiBan {
  // Máximo 100-150 mensajes/día para cuentas nuevas
  private maxMessagesPerDay = 100;
  
  // Warm-up: 2-4 semanas
  private warmUpPeriod = 14 * 24 * 60 * 60 * 1000; // 14 días
  
  // Delay entre mensajes
  private minDelayBetweenMessages = 20000; // 20 segundos

  async validateSend(): Promise<boolean> {
    // Verificar límites antes de enviar
    return true;
  }
}
```

---

## 5. Instagram - instagrapi

### Código

```typescript
// src/modules/platform/instagram/instagram.adapter.ts
import { Client } from 'instagrapi';

export class InstagramAdapter {
  private client: Client;

  async login(username: string, password: string): Promise<void> {
    await this.client.login(username, password);
  }

  async uploadPost(imagePath: string, caption: string): Promise<string> {
    const media = await this.client.photo_upload(imagePath, caption);
    return media.id;
  }

  async uploadStory(imagePath: string): Promise<string> {
    return this.client.photo_upload_to_story(imagePath);
  }

  async uploadReel(videoPath: string, caption: string): Promise<string> {
    return this.client.clip_upload(videoPath, caption);
  }
}
```

---

## 6. TikTok - Phantomwright

### Código

```typescript
// src/modules/platform/tiktok/tiktok.adapter.ts
import { uploadTikTok } from 'tiktok-auto-uploader';

export class TikTokAdapter {
  async upload(videoPath: string, description: string, accountName: string): Promise<string> {
    const result = await uploadTikTok({
      video: videoPath,
      description: description,
      accountname: accountName,
      headless: true,
      stealth: true,
      proxy: {
        server: process.env.TIKTOK_PROXY,
        username: process.env.TIKTOK_PROXY_USER,
        password: process.env.TIKTOK_PROXY_PASS
      }
    });
    
    return result.id;
  }
}
```

---

## Resumen de Plataformas

| Plataforma | Método Principal | Riesgo Ban | Costo |
|------------|------------------|------------|-------|
| Twitter/X | Twikit (cookies) | Bajo | FREE |
| Facebook | Graph API | Bajo | FREE |
| Instagram | instagrapi | Medio | FREE |
| TikTok | Phantomwright | Alto | FREE |
| LinkedIn | Playwright | Medio | FREE |
| Threads | Graph API | Muy bajo | FREE |
| Telegram | Bot API | Muy bajo | FREE |
| WhatsApp | Baileys | Medio | FREE |

---

## Referencias

- Twikit: https://github.com/d60/twikit
- instagrapi: https://github.com/divoc/instagrapi
- Baileys: https://github.com/WhiskeySockets/Baileys
- TikTok Auto Uploader: https://github.com/haziq-exe/TikTokAutoUploader
- python-telegram-bot: https://github.com/python-telegram-bot/python-telegram-bot