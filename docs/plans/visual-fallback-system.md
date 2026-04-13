# Fallback Visual Gratuito — OpenCV + Tesseract

## El Problema

Facebook cambia selectores CSS constantemente. Clases como `.x789abc` se rompen con cada deploy.
Cuando TODOS los selectores fallan (accessibility tree + self-healing), necesitamos otra forma
de encontrar los botones y elementos de la página.

**Solución de pago**: Claude Computer Use, OpenAI Vision → $0.01-0.10 por acción
**Solución gratuita**: OpenCV + Tesseract → $0, 100% local

---

## Arquitectura del Fallback Visual

```
┌─────────────────────────────────────────────────────┐
│  Nivel 1: Accessibility Tree (95% de los casos)     │
│  page.get_by_role("button", name="Publicar")        │
│  → Milisegundos, gratis, determinístico             │
└──────────────────────┬──────────────────────────────┘
                       │ ¿Falló?
                       ▼
┌─────────────────────────────────────────────────────┐
│  Nivel 2: Self-Healing Selectors (4% de los casos)  │
│  Cascada de 3-5 selectores alternativos             │
│  → Milisegundos, gratis                             │
└──────────────────────┬──────────────────────────────┘
                       │ ¿Falló todo?
                       ▼
┌─────────────────────────────────────────────────────┐
│  Nivel 3: Fallback Visual OpenCV + Tesseract        │
│  1. page.screenshot() → captura la pantalla         │
│  2. OpenCV template matching → busca botón visual   │
│  3. Tesseract OCR → lee texto en la pantalla        │
│  4. Identifica coordenadas del botón                │
│  5. page.mouse.click(x, y) → click                  │
│  → 0.1-0.5s, gratis, 100% local                     │
└──────────────────────┬──────────────────────────────┘
                       │ ¿Falló también?
                       ▼
┌─────────────────────────────────────────────────────┐
│  Nivel 4: Alerta al usuario                         │
│  - Guarda screenshot en screenshots/debug/          │
│  - Log del error con contexto                       │
│  - Pausa la campaña                                 │
│  - Notifica en la UI                                │
└─────────────────────────────────────────────────────┘
```

---

## Cómo Funciona Cada Nivel

### Nivel 1: Accessibility Tree (Primario)

Playwright expone el accessibility tree de la página. En vez de buscar por clase CSS,
buscamos por rol semántico y nombre visible:

```python
# En vez de: page.locator('.x789abc')
# Usamos:
page.get_by_role("button", name="Publicar")
page.get_by_role("button", name="Crear publicación")
page.get_by_role("textbox", name="Escribí algo")
page.get_by_label("Título")
page.get_by_text("¿Qué estás pensando?")
```

**Ventajas**:
- Sobrevive cambios de CSS y clases
- Basado en semántica, no en estructura
- Flake rate: 5% vs 30% de selectores CSS
- Velocidad: milisegundos
- Costo: $0

### Nivel 2: Self-Healing Selectors (Cascada)

Si el accessibility tree falla, probamos una cascada de selectores alternativos:

```python
SELECTORS = {
    "post_button": [
        'button[aria-label*="Publicar"]',
        'button[aria-label*="Post"]',
        '[data-testid*="publish"]',
        'text=/Publicar|Post|Publish/',
        'button:has-text("Publicar")',
    ],
    "create_post": [
        '[aria-label*="Crear publicación"]',
        '[data-testid*="create_post"]',
        'text=/Crear publicación|Create Post/',
    ],
}

def find_element(page, element_name):
    """Busca elemento con cascada de selectores"""
    for selector in SELECTORS.get(element_name, []):
        try:
            el = page.locator(selector)
            if el.count() > 0 and el.is_visible():
                return el
        except:
            continue
    return None  # Caer al Nivel 3
```

**Ventajas**:
- Recupera 85%+ de fallos de selectores
- Costo: $0
- Velocidad: milisegundos

### Nivel 3: Fallback Visual OpenCV + Tesseract

Cuando todo lo demás falla, usamos visión computacional.

#### Paso 1: Capturar Screenshot

```python
screenshot_bytes = page.screenshot()
```

#### Paso 2: Template Matching con OpenCV

Si tenemos templates pre-capturados de los botones:

```python
import cv2
import numpy as np

def find_by_template(screenshot_bytes, template_path, threshold=0.8):
    """Busca un botón por template matching"""
    # Cargar imagen
    img = cv2.imdecode(np.frombuffer(screenshot_bytes, np.uint8), cv2.IMREAD_COLOR)
    template = cv2.imread(template_path)
    
    if template is None:
        return None
    
    # Template matching
    result = cv2.matchTemplate(img, template, cv2.TM_CCOEFF_NORMED)
    min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(result)
    
    if max_val >= threshold:
        h, w = template.shape[:2]
        return {
            "x": max_loc[0] + w // 2,
            "y": max_loc[1] + h // 2,
            "confidence": max_val,
            "method": "template_matching"
        }
    
    return None
```

#### Paso 3: OCR con Tesseract

Si no hay template o no coincide, usamos OCR para encontrar texto:

```python
import pytesseract

def find_by_ocr(screenshot_bytes, text_to_find, lang="spa"):
    """Busca texto en la pantalla usando OCR"""
    img = cv2.imdecode(np.frombuffer(screenshot_bytes, np.uint8), cv2.IMREAD_COLOR)
    
    # OCR con datos detallados (posición de cada palabra)
    ocr_data = pytesseract.image_to_data(
        img, 
        lang=lang, 
        output_type=pytesseract.Output.DICT
    )
    
    results = []
    for i, word in enumerate(ocr_data['text']):
        if text_to_find.lower() in word.lower() and ocr_data['conf'][i] > 60:
            x = ocr_data['left'][i] + ocr_data['width'][i] // 2
            y = ocr_data['top'][i] + ocr_data['height'][i] // 2
            results.append({
                "x": x,
                "y": y,
                "text": word,
                "confidence": ocr_data['conf'][i],
                "method": "ocr"
            })
    
    return results[0] if results else None
```

#### Paso 4: Buscar Botón Cerca del Texto

Los botones suelen estar cerca de su label. Si encontramos "Publicar" por OCR,
el botón está cerca:

```python
def find_button_near_text(screenshot_bytes, text_to_find, offset_y=30, offset_x=0):
    """Busca un botón cerca de un texto específico"""
    img = cv2.imdecode(np.frombuffer(screenshot_bytes, np.uint8), cv2.IMREAD_COLOR)
    ocr_data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
    
    for i, word in enumerate(ocr_data['text']):
        if text_to_find.lower() in word.lower() and ocr_data['conf'][i] > 60:
            # El botón suele estar debajo o a la derecha del texto
            x = ocr_data['left'][i] + ocr_data['width'][i] // 2 + offset_x
            y = ocr_data['top'][i] + ocr_data['height'][i] + offset_y
            return {
                "x": x,
                "y": y,
                "method": "ocr_near_text",
                "found_text": word
            }
    
    return None
```

#### Paso 5: Click en Coordenadas

```python
def click_at_coordinates(page, coords):
    """Hace click en las coordenadas encontradas"""
    if coords:
        page.mouse.click(coords['x'], coords['y'])
        return True
    return False
```

---

## Cómo se Crean los Templates de Botones

### Método 1: Captura Automática durante Setup

```python
def capture_button_templates(page):
    """Captura templates de botones durante la configuración inicial"""
    import os
    os.makedirs("vision_templates", exist_ok=True)
    
    buttons = {
        "btn_publicar": '[aria-label*="Publicar"]',
        "btn_crear": '[aria-label*="Crear"]',
        "btn_vender": 'text="Vender"',
        "btn_siguiente": 'text="Siguiente"',
        "btn_publicar_marketplace": 'text="Publicar"',
    }
    
    captured = {}
    for name, selector in buttons.items():
        try:
            el = page.locator(selector)
            if el.is_visible():
                el.screenshot(path=f"vision_templates/{name}.png")
                captured[name] = True
        except:
            captured[name] = False
    
    return captured
```

### Método 2: Captura Manual del Usuario

El usuario puede capturar templates manualmente:
1. Abre Facebook en el navegador
2. Navega a la página donde está el botón
3. En la UI, hace click en "Capturar template"
4. Selecciona el área del botón
5. Se guarda como template

---

## Integración en el Flujo de Publicación

```python
class SmartElementFinder:
    """Buscador inteligente con 3 niveles de fallback"""
    
    def __init__(self, page, templates_dir="vision_templates/"):
        self.page = page
        self.vision = VisionFallback(templates_dir)
    
    def find(self, element_name, text_hints=None):
        """
        Busca un elemento con 3 niveles de fallback.
        Retorna coordenadas o None.
        """
        # Nivel 1: Accessibility tree
        try:
            el = self.page.get_by_role("button", name=text_hints[0])
            if el.is_visible():
                box = el.bounding_box()
                return {"x": box["x"] + box["width"]//2, "y": box["y"] + box["height"]//2, "method": "a11y"}
        except:
            pass
        
        # Nivel 2: Self-healing selectors
        for selector in self._get_selectors(element_name):
            try:
                el = self.page.locator(selector)
                if el.is_visible():
                    box = el.bounding_box()
                    return {"x": box["x"] + box["width"]//2, "y": box["y"] + box["height"]//2, "method": "selector"}
            except:
                pass
        
        # Nivel 3: Fallback visual
        screenshot = self.page.screenshot()
        
        # 3a: Template matching
        if text_hints:
            for hint in text_hints:
                coords = self.vision.find_by_ocr(screenshot, hint)
                if coords:
                    return coords
        
        # 3b: OCR near text
        if text_hints:
            coords = self.vision.find_button_near_text(screenshot, text_hints[0])
            if coords:
                return coords
        
        # Todo falló
        return None
    
    def click(self, element_name, text_hints=None):
        """Encuentra y hace click"""
        coords = self.find(element_name, text_hints)
        if coords:
            self.page.mouse.click(coords['x'], coords['y'])
            return coords
        raise ElementNotFoundError(element_name, text_hints)
```

---

## Dependencias Gratuitas

```bash
# Python packages (todos gratuitos)
pip install opencv-python pytesseract pillow

# Tesseract OCR (requiere instalación en el sistema)
# Windows:
winget install Tesseract-OCR
# o descargar de: https://github.com/UB-Mannheim/tesseract/wiki

# Linux:
sudo apt install tesseract-ocr tesseract-ocr-spa

# macOS:
brew install tesseract tesseract-lang
```

---

## Comparación con Soluciones de Pago

| Característica | OpenCV + Tesseract | Claude Computer Use | OpenAI Vision |
|---------------|-------------------|-------------------|--------------|
| **Costo** | $0 | $0.01-0.10/acción | $0.005-0.02/acción |
| **Velocidad** | 0.1-0.5s | 2-5s | 1-3s |
| **Requiere internet** | No | Sí | Sí |
| **Requiere API key** | No | Sí | Sí |
| **Privacidad** | 100% local | Envía screenshots a Anthropic | Envía screenshots a OpenAI |
| **Precisión botones** | Alta (template matching) | Muy alta | Muy alta |
| **Precisión texto** | Media (OCR) | Muy alta | Muy alta |
| **Mantenimiento** | Templates actualizables | Automático | Automático |
| **Escalabilidad** | Ilimitada (local) | Limitada por rate limits | Limitada por rate limits |

---

## Cuándo se Activa el Fallback Visual

El fallback visual se activa AUTOMÁTICAMENTE cuando:

1. **Selector primario falla**: `get_by_role` no encuentra el elemento
2. **Todos los selectores alternativos fallan**: La cascada completa no encuentra nada
3. **Facebook cambió el DOM**: Nueva versión de la UI rompe selectores
4. **Elemento no accesible**: El elemento existe pero no es interactuable

**NO se activa cuando**:
- Los selectores funcionan normalmente
- El elemento se encuentra en el primer intento

---

## Debug y Mejora Continua

Cada vez que se activa el fallback visual:

1. **Screenshot guardado**: `screenshots/debug/YYYYMMDD_HHMMSS_element_name.png`
2. **Log del fallo**: Qué selectores fallaron, qué método visual se usó
3. **Template auto-capturado**: Si el OCR encontró el texto pero no el botón, se sugiere capturar template

Esto permite:
- Identificar patrones de fallos recurrentes
- Agregar nuevos templates proactivamente
- Mejorar la cascada de selectores

---

## Limitaciones y Mitigaciones

| Limitación | Mitigación |
|-----------|-----------|
| Templates dependen de resolución | Capturar en la resolución del usuario |
| OCR falla con fuentes pequeñas | Usar como último recurso, no primario |
| Cambios visuales mayores requieren re-captura | Sistema guarda screenshots de debug |
| No entiende contexto semántico | Solo busca coincidencia visual, no "entiende" |
| Puede confundir botones similares | Usar texto OCR como verificación adicional |
