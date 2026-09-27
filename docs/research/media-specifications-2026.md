# Especificaciones de Media por Plataforma (2026)
> Parte de: [[README]] · Relacionados: [[complete-repos-inventory]] · [[marketplace-argentina]] · [[repositories-analysis]]

## Imagen Resumen

| Plataforma | Feed Optimal | Stories | Carousel Max | Aspect Ratios |
|------------|--------------|---------|--------------|---------------|
| Facebook | 1080x1350 (4:5) | 1080x1920 (9:16) | 10 imágenes | 1:1, 4:5, 16:9, 9:16 |
| Instagram | 1080x1350 (4:5) | 1080x1920 (9:16) | 20 imágenes | 1:1, 4:5, 1.91:1 |
| TikTok | 1080x1920 (9:16) | 1080x1920 (9:16) | 35 (Photo Mode) | 9:16, 1:1, 4:5 |
| Twitter/X | 1280x720 (16:9) | N/A | 4 imágenes | 16:9, 1:1, 9:16 |
| LinkedIn | 1200x627 (1.91:1) | N/A | 9 imágenes | 1.91:1, 1:1, 4:5 |
| Threads | 1440x1920 (3:4) | N/A | 20 imágenes | 3:4, cualquier ratio |
| Telegram | Original (sin límite) | 1080x1920 | 10 imágenes | Cualquiera |
| WhatsApp | 1080x1920 (9:16) | 1080x1920 (9:16) | 30 imágenes | 9:16 |

## Video Resumen

| Plataforma | Feed Max | Reels/Shorts | Stories | Formatos |
|------------|----------|--------------|---------|----------|
| Facebook | 240 min | 90s Reels | 60s | MP4, MOV, GIF |
| Instagram | 60 min | 90s Reels | 60s | MP4, MOV |
| TikTok | 60 min | N/A | 24h Stories | MP4, MOV |
| Twitter/X | 4h (Premium) | N/A | N/A | MP4, MOV |
| LinkedIn | 30 min | N/A | N/A | MP4, MOV, FLV |
| Threads | 5 min | N/A | N/A | MP4, MOV |
| Telegram | Ilimitado | N/A | 24h (Premium) | Cualquiera |
| WhatsApp | Ilimitado | N/A | 30s Status | MP4, MOV, AVI |

---

## 1. FACEBOOK

### Imágenes

| Formato | Dimensiones | Aspect Ratio | Max Size | Formatos |
|---------|-------------|--------------|----------|----------|
| Profile Picture | 320x320px (upload), 176x176px (display) | 1:1 | 4MB | JPG, PNG |
| Cover Photo | 851x315px | 16:9 | 100KB opt | JPG, PNG |
| Feed Post (Landscape) | 1080x566px | 1.91:1 | 4MB | JPG, PNG |
| Feed Post (Vertical) | 1080x1350px | 4:5 | 4MB | JPG, PNG |
| Feed Post (Square) | 1080x1080px | 1:1 | 4MB | JPG, PNG |
| Carousel/Album | 1080x1080px o 1080x1350px | 1:1 o 4:5 | 4MB c/u | JPG, PNG |
| Stories | 1080x1920px | 9:16 | 30MB | JPG, PNG, GIF |
| Marketplace | 1080x1080px | 1:1 | - | JPG, PNG |

**Notas:**
- Carousel: máximo 10 imágenes, mismo aspect ratio
- Safe area Stories: 1080x1610px

### Videos

| Formato | Resolución | Aspect Ratio | Duración Max | Max Size | Formatos |
|---------|------------|--------------|--------------|----------|----------|
| Feed Video (Landscape) | 1280x720px min | 16:9 | 240 min | 10GB | MP4, MOV |
| Feed Video (Square) | 1080x1080px | 1:1 | 240 min | 10GB | MP4, MOV |
| Feed Video (Vertical) | 720x1280px | 9:16 | 240 min | 10GB | MP4, MOV |
| Stories | 1080x1920px | 9:16 | 60s total | 4GB | MP4, MOV |
| Reels | 1080x1920px | 9:16 | 90s (rec), 3min (upload) | 4GB | MP4, MOV |
| Live Streaming | hasta 1080p | 16:9 o 9:16 | 8 horas | - | RTMP |

**Especificaciones técnicas:**
- Bitrate mínimo: 256 kbps
- Frame rate: 30 fps
- Audio: AAC/MP3, 256 kbps max, Stereo
- HDR: No (SDR only)
- 4K: Sí (auto-downscaled)

### Features Especiales (2026)

- **Cross-posting**: Facebook → Instagram Stories/Reels (Meta Business Suite)
- **Auto-generated captions**: Sí, para videos
- **AI editing**: Meta AI backgrounds, text overlays
- **Alt text**: Auto-generado con override manual

---

## 2. INSTAGRAM

### Imágenes

| Formato | Dimensiones | Aspect Ratio | Max Size | Formatos |
|---------|-------------|--------------|----------|----------|
| Profile Picture | 320x320px (stored), 110x110px (display) | 1:1 | - | JPG, PNG |
| Feed Post (Landscape) | 1080x566px | 1.91:1 | 30MB | JPG, PNG, HEIF |
| Feed Post (Vertical) | 1080x1350px | 4:5 | 30MB | JPG, PNG, HEIF |
| Feed Post (Square) | 1080x1080px | 1:1 | 30MB | JPG, PNG, HEIF |
| Carousel | 1080x1350px (recomendado) | 4:5 o 1:1 | 30MB c/u | JPG, PNG |
| Stories | 1080x1920px | 9:16 | 30MB | JPG, PNG, GIF |
| Reels Cover | 1080x1920px (feed), 1080x1440px (grid) | 9:16 / 3:4 | 30MB | JPG, PNG |

**Notas:**
- Carousel: máximo 20 imágenes (2026), mismo aspect ratio
- Safe area Stories: 1080x1610px
- Safe zones Reels: 14% top, 35% bottom, 6% sides

### Videos

| Formato | Resolución | Aspect Ratio | Duración | Max Size | Formatos |
|---------|------------|--------------|----------|----------|----------|
| Reels | 720p min, 1080p rec | 1.91:1 a 9:16 | 3s - 3min | 4GB | MP4, MOV |
| Stories | 1080x1920px | 9:16 | 1-60s | 4GB | MP4, MOV, GIF |
| Carousel Video | 1080x1080 o 1080x1350px | 1:1 o 4:5 | 3-60s c/u | 4GB | MP4, MOV |
| Live | 1080x1920px | 9:16 | hasta 4h | - | RTMP |

**Especificaciones técnicas:**
- Frame rate: 30 fps mínimo, hasta 60 fps
- Audio: AAC, 256 kbps max, Stereo
- HDR: Sí (HDR10 limitado para Reels)
- 4K: No (downscalea a 1080p)

### Features Especiales (2026)

- **Carousel**: Hasta 20 imágenes (nuevo)
- **Cross-posting**: Instagram → Facebook Stories/Reels
- **Auto-generated captions**: Sí, para Reels/Stories
- **AI editing**: Meta AI stickers, backgrounds, audio remix
- **Alt text**: Sí, con sugerencias AI

---

## 3. TIKTOK

### Imágenes

| Formato | Dimensiones | Aspect Ratio | Max Size | Formatos |
|---------|-------------|--------------|----------|----------|
| Profile Picture | 200x200px | 1:1 | - | JPG, PNG |
| Carousel (Photo Mode) | 1080x1920px (recomendado) | 9:16 | - | JPG, PNG |
| Stories | 1080x1920px | 9:16 | - | JPG, PNG |

**Notas:**
- **Photo Mode**: Hasta 35 imágenes con música (nuevo 2024-2025)
- También soporta 1:1 y 4:5
- Stories desaparecen a las 24h

### Videos

| Formato | Resolución | Aspect Ratio | Duración | Max Size | Formatos |
|---------|------------|--------------|----------|----------|----------|
| In-Feed Video | 1080x1920px | 9:16 | hasta 10min | 72MB (Android), 278MB (iOS), 1GB (web) | MP4, MOV |
| Stories | 1080x1920px | 9:16 | hasta 15s | 72MB (Android), 278MB (iOS) | MP4, MOV |
| Live Streaming | 1080x1920px | 9:16 | Ilimitado | - | RTMP |

**Especificaciones técnicas:**
- Frame rate: 23-60 fps
- Bitrate mínimo: 516 kbps
- Audio: AAC, 128 kbps max, Stereo
- HDR: Sí (HDR10)
- 4K: No (max 1080p)

### Features Especiales (2026)

- **Photo Mode**: 35 imágenes máximo con música automática
- **AI Alive**: Transforma fotos estáticas en videos
- **AI Editor**: Transformación de texto
- **Duet/Stitch**: Features colaborativos únicos
- **Auto-captions**: Sí
- **TikTok Sound Library**: Música royalty-free extensa

---

## 4. TWITTER/X

### Imágenes

| Formato | Dimensiones | Aspect Ratio | Max Size | Formatos |
|---------|-------------|--------------|----------|----------|
| Profile Picture | 400x400px | 1:1 | 2MB | JPG, PNG, GIF |
| Header/Banner | 1500x500px | 3:1 | 5MB | JPG, PNG, GIF |
| In-Stream Photo (Landscape) | 1280x720px | 16:9 | 5MB (mobile), 15MB (web) | JPG, PNG, GIF |
| In-Stream Photo (Vertical) | 720x1280px | 9:16 | 5MB (mobile), 15MB (web) | JPG, PNG, GIF |
| In-Stream Photo (Square) | 1080x1080px | 1:1 | 5MB (mobile), 15MB (web) | JPG, PNG, GIF |
| GIF | 1280x1080px | Varios | 15MB | GIF |

**Notas:**
- Máximo 4 imágenes por tweet
- Auto-play en feed

### Videos

| Formato | Resolución | Aspect Ratio | Duración | Max Size | Formatos |
|---------|------------|--------------|----------|----------|----------|
| In-Feed Video (Landscape) | 1280x720px | 16:9 | 0.5s - 140s | 512MB | MP4, MOV |
| In-Feed Video (Square) | 720x720px | 1:1 | 0.5s - 140s | 512MB | MP4, MOV |
| In-Feed Video (Vertical) | 720x1280px | 9:16 | 0.5s - 140s | 512MB | MP4, MOV |
| Video Tab (Long-form) | 720x1280px min | 9:16 | hasta 2h (Premium) | 512MB | MP4, MOV |
| Live Streaming | hasta 1080p | 16:9 o 9:16 | Ilimitado | - | RTMP, HLS |

**Especificaciones técnicas:**
- Frame rate: 30-60 fps
- Audio: AAC, 128 kbps max, Stereo
- HDR: No
- 4K: No

### Features Especiales (2026)

- **Auto-captions**: Sí
- **Grok AI**: Generación de texto
- **Alt text**: Sí, soportado
- **Premium+**: 25,000 caracteres, videos 4h

---

## 5. LINKEDIN

### Imágenes

| Formato | Dimensiones | Aspect Ratio | Max Size | Formatos |
|---------|-------------|--------------|----------|----------|
| Personal Profile Picture | 400x400px (rec) | 1:1 | 8MB | JPG, PNG, GIF |
| Personal Cover Photo | 1584x396px | 4:1 | 8MB | JPG, PNG, GIF |
| Company Logo | 400x400px | 1:1 | 8MB | JPG, PNG, GIF |
| Company Banner | 1128x191px | 6:1 | 8MB | JPG, PNG, GIF |
| Feed Post (Landscape) | 1200x627px | 1.91:1 | 8MB | JPG, PNG, GIF |
| Feed Post (Square) | 1200x1200px | 1:1 | 8MB | JPG, PNG, GIF |
| Feed Post (Vertical) | 720x900px | 4:5 | 8MB | JPG, PNG, GIF |
| Carousel (Document) | 1080x1080px | 1:1 | 10MB c/u | PDF, JPG, PNG |

**Notas:**
- Carousel: 2-10 imágenes vía PDF
- Una imagen = hasta 40% más engagement
- Displayed como circle

### Videos

| Formato | Resolución | Aspect Ratio | Duración | Max Size | Formatos |
|---------|------------|--------------|----------|----------|----------|
| In-Feed Video (Landscape) | 1920x1080px | 16:9 | 3s - 10min | 5GB | MP4, MOV, MPEG |
| In-Feed Video (Square) | 1080x1080px | 1:1 | 3s - 10min | 5GB | MP4, MOV, MPEG |
| In-Feed Video (Vertical) | 720x1280px | 9:16 | 3s - 10min | 5GB | MP4, MOV, MPEG |
| Live Streaming | hasta 1080p | 16:9 | hasta 4h | - | RTMP |

**Especificaciones técnicas:**
- Bitrate: hasta 30 Mbps
- Frame rate: 10-60 fps
- Audio: AAC, 256 kbps max, Stereo
- HDR: No
- 4K: No (max 1080p)

### Features Especiales (2026)

- **LinkedIn AI**: Sugerencias de posts
- **Auto-captions**: Sí
- **Document carousel**: PDF upload como carousel
- **Alt text**: Sí, recomendado

---

## 6. THREADS

### Imágenes

| Formato | Dimensiones | Aspect Ratio | Max Size | Formatos |
|---------|-------------|--------------|----------|----------|
| Profile Picture | 640x640px | 1:1 | - | JPG, PNG |
| Post Image | 1440x1920px (rec) | 0.01:1 a 10:1 | 8MB | JPG, PNG, GIF |
| Carousel | 1440x1920px | 3:4 (rec) | 8MB c/u | JPG, PNG, GIF |

**Notas:**
- Min width: 320px, Max width: 1440px
- Hasta 20 imágenes por thread
- Profile synced from Instagram

### Videos

| Formato | Resolución | Aspect Ratio | Duración | Max Size | Formatos |
|---------|------------|--------------|----------|----------|----------|
| In-Feed Video | hasta 1440x1920px | 0.01:1 a 10:1 | hasta 5min | 8MB | MP4, MOV |

**Especificaciones técnicas:**
- Frame rate: 30 fps
- Audio: AAC, 256 kbps max, Stereo
- HDR: No
- 4K: No

### Features Especiales (2026)

- **Cross-posting**: Threads → Instagram Stories/Feed (seamless)
- **Auto-post to Instagram**: Sí
- **Auto-captions**: Vía Instagram integration
- **NO soporta hashtags**: Importante
- **Alt text**: Synced from Instagram

---

## 7. TELEGRAM

### Imágenes

| Formato | Dimensiones | Max Size | Formatos |
|---------|-------------|----------|----------|
| Profile Picture | 800x800px | - | JPG, PNG |
| Channel/Group Picture | 800x800px | - | JPG, PNG |
| Post Image | Original (sin límite) | 2GB (free), 5GB (Premium) | JPG, PNG, WEBP, GIF |

**Notas:**
- NO comprime imágenes
- Preserva calidad original
- Premium: 4GB archivos

### Videos

| Formato | Resolución | Duración | Max Size | Formatos |
|---------|------------|----------|----------|----------|
| Video Message | hasta 4K | hasta 1h (channel) | 2GB (free), 5GB (Premium) | MP4, MOV, MKV, WEBM |
| Video Note (Round) | 384x384px | hasta 1min | 64MB | MP4 |
| GIF | hasta 1080p | Loop | 2GB (free), 5GB (Premium) | GIF, MP4 |

**Especificaciones técnicas:**
- Frame rate: hasta 60 fps
- Audio: AAC, MP3, FLAC, OPUS, OGG (sin límite bitrate)
- HDR: Sí (playback depende del device)
- 4K: Sí (full support)

### Features Especiales (2026)

- **Bot API**: 100% gratis, automatización ilimitada
- **No compression**: Original quality preserved
- **Live Photos**: Sí (iOS-style)
- **Bot-managed content**: Nuevo 2026
- **Stories**: Sí (Premium, 24h)

---

## 8. WHATSAPP

### Imágenes

| Formato | Dimensiones | Aspect Ratio | Max Size | Formatos |
|---------|-------------|--------------|----------|----------|
| Profile Picture | 500x500px | 1:1 | - | JPG, PNG |
| Status Image | 1080x1920px | 9:16 | 5MB | JPG, PNG, GIF |
| Chat Image | Sin límite específico | Any | 2GB | JPG, PNG, WEBP |
| Business Catalog | 800x800px | 1:1 | 5MB | JPG, PNG |

**Notas:**
- Chat: Heavy compression
- Status: 30 slides máximo
- Send as Document para quality original

### Videos

| Formato | Resolución | Aspect Ratio | Duración | Max Size | Formatos |
|---------|------------|--------------|----------|----------|----------|
| Status Video | 1080x1920px | 9:16 | hasta 60s | 16MB (auto-compressed) | MP4, MOV, 3GP, MKV |
| Chat Video | 856x480px (compressed) | 16:9 | hasta 2min | 16MB (compressed), 2GB (as file) | MP4, MOV, 3GP, MKV, WEBM |
| Video Call | 720p | 16:9 | Ilimitado | N/A | - |
| Video Note | 384x384px | 1:1 | hasta 60s | Auto-compressed | MP4 |

**Especificaciones técnicas:**
- Audio: AAC, OPUS, AMR
- Bitrate: 64 kbps (compressed), Stereo
- HDR: No
- 4K: No

### Features Especiales (2026)

- **Channels**: Broadcast messaging (one-to-many)
- **Cross-posting**: WhatsApp Status → Facebook/Instagram Stories
- **Business API**: 1000 conversaciones gratis/mes
- **No auto-captions**: Limitado

---

## Hashtags por Plataforma

| Plataforma | Máximo | Recomendado | Notas |
|------------|--------|-------------|-------|
| Instagram | 30 | 10-15 | Más no es mejor |
| TikTok | Sin límite | 3-5 | Trending hashtags |
| Twitter/X | Sin límite | 1-2 | Menos es más |
| LinkedIn | Sin límite | 3-5 | Relevantes |
| Threads | **NO SOPORTA** | - | No hashtags |
| Facebook | Sin límite | 2-3 | Relevantes |
| Telegram | Sin límite | - | Opcional |
| WhatsApp | N/A | - | No aplica |

---

## Cross-Posting Matrix (2026)

| Desde → Hasta | Facebook | Instagram | TikTok | Twitter | LinkedIn | Threads | Telegram | WhatsApp |
|----------------|----------|-----------|--------|---------|----------|---------|----------|----------|
| **Facebook** | - | ✅ Reels/Stories | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Instagram** | ✅ Stories/Reels | - | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **TikTok** | ❌ | ❌ (manual) | - | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Twitter/X** | ❌ | ❌ | ❌ | - | ❌ | ❌ | ❌ | ❌ |
| **LinkedIn** | ❌ | ❌ | ❌ | ❌ | - | ❌ | ❌ | ❌ |
| **Threads** | ❌ | ✅ Feed/Stories | ❌ | ❌ | ❌ | - | ❌ | ❌ |
| **Telegram** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | - | ❌ |
| **WhatsApp** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | - |

**Leyenda:**
- ✅ = Cross-posting nativo soportado
- ❌ = No soportado
- (manual) = Export manual

---

## Audio Codecs Summary

| Plataforma | Codecs Soportados | Max Bitrate | Mono/Stereo |
|------------|-------------------|-------------|-------------|
| Facebook | AAC, MP3 | 256 kbps | Stereo |
| Instagram | AAC | 256 kbps | Stereo |
| TikTok | AAC | 128 kbps | Stereo |
| Twitter/X | AAC | 128 kbps | Stereo |
| LinkedIn | AAC | 256 kbps | Stereo |
| Threads | AAC | 256 kbps | Stereo |
| Telegram | AAC, MP3, FLAC, OPUS, OGG | Sin límite | Stereo |
| WhatsApp | AAC, OPUS, AMR | 64 kbps (compressed) | Mono/Stereo |

---

## Live Streaming Specifications

| Plataforma | Max Duración | Resolución | Bitrate | Frame Rate | Protocolo |
|------------|--------------|------------|---------|------------|-----------|
| Facebook Live | 8 horas | hasta 1080p | 4000-6000 kbps | 30-60 fps | RTMP |
| Instagram Live | 4 horas | 1080x1920 | 4000-6000 kbps | 30 fps | RTMP |
| TikTok Live | Ilimitado | 1080x1920 | 4000-6000 kbps | 30 fps | RTMP |
| Twitter/X Live | Ilimitado | hasta 1080p | 4000-6000 kbps | 30-60 fps | RTMP, HLS |
| LinkedIn Live | 4 horas | hasta 1080p | 3000-6000 kbps | 30 fps | RTMP |
| Telegram | Ilimitado | hasta 4K | Sin límite | 60 fps | RTMP |
| WhatsApp (Video Call) | Ilimitado | 720p | Adaptativo | 30 fps | VoIP |

---

## Notas Importantes para Automatización

### Compresión por Plataforma

| Plataforma | Nivel de Compresión | Recomendación |
|------------|---------------------|---------------|
| Facebook | Media (H.264) | Upload high bitrate |
| Instagram | Alta | Upload highest quality |
| TikTok | Alta | Upload original quality |
| Twitter/X | Muy Agresiva | Upload high bitrate |
| LinkedIn | Media | Upload high quality original |
| Threads | Alta (Meta) | Upload highest quality |
| Telegram | **NINGUNA** | Original preserved |
| WhatsApp | Muy Alta (chat) | Send as Document |

### HDR Support

- ✅ Instagram Reels (limitado, HDR10)
- ✅ TikTok (HDR10)
- ✅ Telegram (playback device-dependent)
- ❌ Facebook
- ❌ Twitter/X
- ❌ LinkedIn
- ❌ Threads
- ❌ WhatsApp

### 4K Support

- ✅ Facebook (auto-downscaled)
- ✅ Telegram (full 4K)
- ❌ Instagram (max 1080p)
- ❌ TikTok (max 1080p)
- ❌ Twitter/X (max 1080p)
- ❌ LinkedIn (max 1080p)
- ❌ Threads (max 1080p)
- ❌ WhatsApp
