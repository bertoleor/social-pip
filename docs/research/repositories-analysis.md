# Investigación de Repositorios Open Source — Facebook Auto Poster

## Resumen Ejecutivo

Se analizaron 6+ repositorios de automatización de Facebook para publicación en grupos y Marketplace.
Ningún repo individual cubre todas las necesidades. La estrategia es combinar lo mejor de cada uno.

---

## Repositorios Analizados

### 1. Tigerzplace/FAP-FacebookAutoPoster ⭐⭐⭐⭐⭐
- **URL**: https://github.com/Tigerzplace/FAP-FacebookAutoPoster
- **Stars**: 21 | **Forks**: 9
- **Tech**: Chrome Extension (JavaScript, HTML, CSS)
- **Licencia**: Propietaria (requiere compra de licencia)
- **Última actualización**: Marzo 2026 (v2.0.2)

**Fortalezas:**
- Mejor sistema anti-ban del mercado open-ish
- Delay ranges con slider dual (min/max)
- Smart delay recommendation basado en cantidad de grupos
- Caption rotation (múltiples posts)
- Retry automático en fallos (8s)
- Pause/Resume de campañas
- Post URL display en logs
- Post-run summary modal
- Saved group lists
- Estimated run time banner
- Link preview multi-link
- Post scheduling integrado

**Debilidades:**
- Licencia propietaria (no podemos copiar código)
- Chrome extension (no es standalone)
- Solo grupos, NO Marketplace

**Qué podemos aprender:**
- Lógica de delay ranges: presets 1-3min, 3-20min, 20-30min
- Warning modal cuando el delay es muy corto para la cantidad de grupos
- Batch breaks: pausas más largas después de X posts
- Estructura de logs detallada

---

### 2. adar2/Facebook-Posts-Automation ⭐⭐⭐⭐
- **URL**: https://github.com/adar2/Facebook-Posts-Automation
- **Stars**: 125 | **Forks**: 38
- **Tech**: Python + Selenium + PyQt5 + SQLite
- **Licencia**: GPL-3.0
- **Última actualización**: Activo

**Fortalezas:**
- Más maduro y popular (125 stars)
- GUI completa con PyQt5
- Multi-cuenta (crear usuarios, login separado)
- Scheduling de tareas
- Scraping de miembros de grupos
- Base de datos SQLite
- Soporte para media (imágenes)
- Carga de archivos JSON批量

**Debilidades:**
- Selenium (más detectable que Playwright)
- PyQt5 (más complejo que Streamlit para no-programadores)
- Requiere geckodriver
- GPL-3.0 (licencia copyleft)

**Qué podemos aprender:**
- Estructura de DB SQLite
- Sistema de usuarios multi-cuenta
- Scheduling con threads separados
- Formato JSON para importar posts y targets

---

### 3. darideveloper/facebook-groups-post-bot ⭐⭐⭐
- **URL**: https://github.com/darideveloper/facebook-groups-post-bot
- **Stars**: 34 | **Forks**: 8
- **Tech**: Python + Selenium
- **Licencia**: MIT ✅
- **Última actualización**: Activo

**Fortalezas:**
- Licencia MIT (libre uso)
- Búsqueda de grupos por keyword (save_groups.py)
- Posts aleatorios (elige random del pool)
- Soporte opcional de imágenes
- Estructura simple y entendible
- data.json para configuración

**Debilidades:**
- Solo texto (imágenes opcionales pero básicas)
- Sin scheduling
- Sin multi-cuenta
- Sin GUI
- Sin anti-ban avanzado

**Qué podemos aprender:**
- Búsqueda de grupos por keyword
- Formato data.json simple
- Lógica de post aleatorio por grupo

---

### 4. HARON416/Facebook-Marketplace-Auto-Poster ⭐⭐⭐
- **URL**: https://github.com/HARON416/Facebook-Marketplace-Auto-Poster
- **Stars**: 14 | **Forks**: 4
- **Tech**: Go + Rod (browser automation)
- **Licencia**: Propietaria
- **Última actualización**: Activo

**Fortalezas:**
- Único repo dedicado a Marketplace
- Batch processing de múltiples productos
- Upload de imágenes
- Smart content parsing desde archivos
- Random delays entre posts
- Group targeting automático
- Trial period management

**Debilidades:**
- Optimizado para Kenya (NO funciona en Argentina/US/EU)
- Layout de Marketplace varía por país
- Licencia propietaria
- Go (diferente al stack Python que elegimos)
- Trial de 72h

**Qué podemos aprender:**
- Estructura de producto: title, price, category, condition, description, tags
- Formato details.txt para productos
- Lógica de upload de múltiples imágenes
- Random delays (30-60s entre posts)
- Detección de rate limits

---

### 5. ariknih/autopost-facebook-group ⭐⭐
- **URL**: https://github.com/ariknih/autopost-facebook-group
- **Stars**: 1 | **Forks**: 0
- **Tech**: Python + Playwright
- **Licencia**: MIT ✅
- **Última actualización**: Activo

**Fortalezas:**
- Multi-cuenta con sesiones JSON
- Smart Link Converter (mobile→desktop)
- Image Injector (múltiples fotos)
- Anti-ban básico con delay natural
- Auto-recovery por grupo (skip si falla)
- También incluye X/Twitter bot

**Debilidades:**
- Muy nuevo (1 star)
- Anti-ban básico
- Sin GUI
- Sin scheduling

**Qué podemos aprender:**
- Sistema de sesiones JSON por cuenta
- Conversión de links mobile a desktop
- Manejo de errores por grupo individual
- Persistent context (perfiles de navegador)

---

### 6. ByamB4/fb-group-auto-post ⭐⭐
- **URL**: https://github.com/ByamB4/fb-group-auto-post
- **Stars**: 11 | **Forks**: 4
- **Tech**: Python + Playwright
- **Licencia**: Sin licencia especificada
- **Última actualización**: 4 commits

**Fortalezas:**
- Simple y directo
- Playwright con cookies persistentes
- groups.json configurable

**Debilidades:**
- Muy básico (solo 4 commits)
- Sin anti-ban
- Sin multi-cuenta
- Sin GUI

---

## Repos Adicionales Encontrados

| Repo | Tech | Notas |
|------|------|-------|
| jhontron6/facebook-playwright-marketplace-posting-saas | JS+Playwright | SaaS Marketplace, 0 stars |
| Macoy66/facebook-automation | Python | Multi-cuenta, comportamiento humano, 0 stars |
| calmroshaan/fb-profile-manager | Python+Playwright | Fingerprint spoofing, 1 star |
| dark313pulsepro585/facebook-marketplace-listing-poster-automation | Python+Selenium | Bulk upload, 0 stars |
| Z786ZA/facebook-posting-bot | Python | Social automation toolkit, 0 stars |

---

## Conclusión

**No existe un repo perfecto.** La estrategia es:

1. **Playwright + Python** como base técnica (mejor que Selenium en 2026)
2. **Inspiración anti-ban** de Tigerzplace/FAP (estudiar, no copiar)
3. **Estructura DB** de adar2 (adaptar PyQt5 → Streamlit)
4. **Marketplace** adaptar HARON416 para Argentina
5. **Multi-cuenta** approach de ariknih (sesiones JSON)
6. **Búsqueda de grupos** de darideveloper (keyword search)
