# Referencias de Código de Otros Repos

## Notas Importantes

⚠️ Estos son fragmentos de referencia para ESTUDIO. NO copiar directamente.
Algunos repos tienen licencias restrictivas (GPL-3.0, propietaria).
Nuestro proyecto usará licencia MIT.

---

## 1. Tigerzplace/FAP — Lógica de Delay Ranges

```javascript
// Concepto: Delay range con presets
const delayPresets = {
  'safe': { min: 180, max: 1200 },
  'moderate': { min: 60, max: 240 },
  'aggressive': { min: 30, max: 90 }
};

function getRecommendedDelay(groupCount) {
  if (groupCount <= 10) return 'moderate';
  if (groupCount <= 25) return 'safe';
  return 'safe';
}

function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
```

---

## 2. adar2/Facebook-Posts-Automation — Estructura DB

```python
import sqlite3

def init_db():
    conn = sqlite3.connect('facebook_bot.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users
                 (id INTEGER PRIMARY KEY, username TEXT, password TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS posts
                 (id INTEGER PRIMARY KEY, user_id INTEGER,
                  msg TEXT, media TEXT, FOREIGN KEY(user_id) REFERENCES users(id))''')
    c.execute('''CREATE TABLE IF NOT EXISTS targets
                 (id INTEGER PRIMARY KEY, user_id INTEGER,
                  target TEXT, FOREIGN KEY(user_id) REFERENCES users(id))''')
    c.execute('''CREATE TABLE IF NOT EXISTS tasks
                 (id INTEGER PRIMARY KEY, user_id INTEGER, post_id INTEGER,
                  target_id INTEGER, date TEXT, name TEXT)''')
    conn.commit()
    return conn
```

---

## 3. ariknih/autopost-facebook-group — Multi-Cuenta con Sesiones

```python
from playwright.sync_api import sync_playwright

def create_session(account_name):
    """Primera vez: login manual y guardar sesión"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()
        page.goto("https://facebook.com")
        input("Presioná ENTER cuando hayas logueado...")
        context.storage_state(path=f"sessions/{account_name}.json")
        browser.close()

def load_session(account_name):
    """Cargar sesión existente"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(
            storage_state=f"sessions/{account_name}.json"
        )
        page = context.new_page()
        return browser, context, page
```

---

## 4. HARON416/Facebook-Marketplace-Auto-Poster — Estructura de Producto

```
# details.txt format:
title: Tu Título
price: $99.99
category: electronics
condition: new
description: Descripción detallada...
tags: tag1, tag2, tag3
```

---

## 5. ByamB4/fb-group-auto-post — Publicación Básica

```python
def post_to_group(page, group_url, content, images=None):
    page.goto(group_url)
    page.click('div[role="textbox"]')
    page.fill('div[role="textbox"]', content)
    if images:
        for img in images:
            page.set_input_files('input[type="file"]', img)
    page.click('button[type="submit"]')
```

---

## Selectores CSS Comunes (a verificar)

```
# Grupo - Crear post
div[role="textbox"][aria-label*="Escribí algo"]
div[contenteditable="true"]

# Grupo - Botón publicar
button[aria-label*="Publicar"]

# Marketplace - Crear listing
a[href*="/marketplace/sell"]

# Marketplace - Upload imágenes
input[type="file"][accept*="image"]

# Detectar rate limit
text="We limit how often you can post"
text="limita la frecuencia"
```

---

## Licencias de Referencia

| Repo | Licencia | Podemos usar |
|------|----------|-------------|
| Tigerzplace/FAP | Propietaria | ❌ NO copiar código |
| adar2/Facebook-Posts-Automation | GPL-3.0 | ⚠️ Solo referencia |
| darideveloper/facebook-groups-post-bot | MIT | ✅ Sí, con atribución |
| HARON416/Facebook-Marketplace-Auto-Poster | Propietaria | ❌ NO copiar código |
| ariknih/autopost-facebook-group | MIT | ✅ Sí, con atribución |
| ByamB4/fb-group-auto-post | Sin licencia | ⚠️ Contactar autor |

**Nuestro proyecto**: MIT License
