# Templates por Sector - Social-Pip
> Parte de: [[README]]

## Resumen

Este documento presenta los **templates de contenido por sector** para Social-Pip. Cada template está diseñado para generar captions que:
1. Respetan las **reglas del Spanish Style Guide**
2. Usan el **dialecto argentino/LATAM** (voseo)
3. Aplican las **prohibiciones de huella de IA**
4. Cumplen con el **Manual de Marca** del sector

---

## I. Sector: Inmobiliario

### 1.1 Perfil del Sector
- **Mercado**: Argentina/LATAM - Venta y alquiler de propiedades
- **Audiencia**: Inversores, familias buscando hogar, profissionais del sector
- **Tono**: Profesional, directo, orientado a resultados
- **CTA típico**: "Consultá", "Escribinos", "Visitá"

### 1.2 Template: Publicación de Propiedad

**Estructura**:
```
[GANCHO - Descripción impactante de la propiedad]
[DETALLE - Características clave]
[PRECIO - Visible y competitivo]
[UBICACIÓN - Barrio/Zona]
[CTA - Acción requerida]
[HASHTAGS - Sector específicos]
```

**Template**:
```json
{
  "sector": "inmobiliario",
  "template": {
    "structure": [
      {
        "type": "hook",
        "description": "Descripción breve de la propiedad",
        "example": "USD 180.000 - PH de 3 ambientes en Villa Crespo",
        "rules": "No usar 'vibrante', 'hermoso', 'increíble'. Usar datos concretos."
      },
      {
        "type": "features",
        "description": "Características principales",
        "example": "2 dormitorios, 1 baño, cocina integrada, patio de 20m², orientación norte",
        "rules": "Separar con comas. Usar abreviaturas comunes (amb., m², orient.)"
      },
      {
        "type": "price",
        "description": "Precio visible",
        "example": "USD 180.000 (negociable)",
        "rules": "Siempre incluir moneda. Puede indicar 'negociable' o 'contado'."
      },
      {
        "type": "location",
        "description": "Ubicación",
        "example": "Villa Crespo, CABA. A 200m de subway línea B",
        "rules": "Incluir barrio y referencia de transporte si aplica."
      },
      {
        "type": "cta",
        "description": "Llamado a la acción",
        "example": "📱 Escribinos para visita: 11-1234-5678",
        "rules": "Usar emoji de teléfono. Incluir WhatsApp si corresponde."
      },
      {
        "type": "hashtags",
        "description": "Hashtags sector",
        "example": "#inmobiliario #propiedad #inversion #bsas #villacrespo",
        "rules": "Máximo 5 hashtags. Incluir ciudad si es relevante."
      }
    ],
    "characterLimit": 500,
    "emojiMax": 3,
    "example": "USD 180.000 - PH de 3 ambientes en Villa Crespo\n\n2 dormitorios, 1 baño, cocina integrada, patio de 20m², orientación norte.\n\n📱 Escribinos para visita: 11-1234-5678\n\n#inmobiliario #propiedad #inversion #bsas #villacrespo"
  }
}
```

### 1.3 Template: Inversión Inmobiliaria

**Estructura**:
```
[GANCHO - ROI/Tipo de propiedad]
[MERCADOS - Datos del barrio]
[OPORTUNIDAD - Por qué invertir ahora]
[CTA]
[HASHTAGS]
```

**Example**:
```
Monoambiente en Palermo SOHO - USD 95.000
Renta promedio: USD 650/mes (6.8% anual)
Barrio en expansión: nuevos desarrollos, metro cercano, zona comercial.

Inversión sólida en zona con plusvalía asegurada.
📱 Contactanos para carpeta de inversión.
#inversioninmobiliaria #renta #palermo #bsas #propiedad
```

---

## II. Sector: Esoterismo

### 2.1 Perfil del Sector
- **Mercado**: Argentina/LATAM - Servicios esotéricos, tarot, rituales, espiritualidad
- **Audiencia**: Personas buscando orientación, bienestar espiritual, soluciones a problemas
- **Tono**: Misterio, sin ser dramático; profesional pero cercano
- **CTA típico**: "Consultá tu sesión", "Reservá tu turno"

### 2.2 Template: Servicio de Tarot

**Estructura**:
```
[GANCHO - Resultado o beneficio]
[MÉTODO - Cómo se realiza]
[RESULTADOS - Qué obtiene el cliente]
[CTA]
[HASHTAGS]
```

**Example**:
```
Las cartas no mienten: tu situación actual tiene una salida.
\n
Lectura de tarot arcanos mayores (15 minutos).
解读 de tus 3 áreas: amor, trabajo, finanzas.
\n
Sesión por videollamada o presencial en CABA.
📱 Reservá tu turno: [WhatsApp]
\n
#tarot #lectura #esoterismo #arcanos #spiritualidad
```

**Reglas de Estilo**:
- ❌ NO usar: "magia", "poder oculto", "encantamiento"
- ✅ USAR: "lectura", "interpretación", "orientación"
- ❌ NO usar: "ritual de amor" (sounds dramático)
- ✅ USAR: "consulta", "sesión", "orientación"

### 2.3 Template: Ritual de Limpieza

**Example**:
```
Tu espacio acumula energía que no te deja avanzar.
\n
Ritual de limpieza con sal marina, romero y cantonera.
Protocolo completo: preparación, ejecución, cierre.
Resultados en 7 días.
\n
Envianos mensaje para详解 del proceso.
#limpiezaenergetica #ritual #esoterismo #sala #energia
```

---

## III. Sector: Digital/Tech

### 3.1 Perfil del Sector
- **Mercado**: Argentina/LATAM - Cursos, productos digitales, servicios tech
- **Audiencia**: Profesionales buscando capacitación, emprendedores, empresas
- **Tono**: Técnico, asertivo, basado en datos
- **CTA típico**: "Inscribite", "Accedé al curso", "Descargá el ebook"

### 3.2 Template: Curso Digital

**Estructura**:
```
[GANCHO - Resultado del curso]
[CURRICULUM - Lo que se aprende]
[DURACIÓN - Tiempo de inversión]
[PRECIO - Inversión]
[CTA]
[HASHTAGS]
```

**Example**:
```
De cero a freelancer en 8 semanas.
\n
Módulos: cliente perfecto, propuesta winner, pricing, cierre, portfolio.
Clases en vivo, grupal, con feedback real.
\n
8 semanas | 2 hs/semana | Grabaciones incluidas.
Inversión: $45.000 ARS (3 cuotas sin interés).
\n
📲 Cupos limitados. Escribinos para programa completo.
#freelancer #digital #trabajo #cursos #negocios
```

### 3.3 Template: Producto Digital

**Example**:
```
No más hojas de cálculo infinitas.
\n
Plantilla Notion para gestión de proyectos:
- Dashboard automátic0
- Kanban integrado
- Reportes semanales
\n
Descarga inmediata. Tested por 200+ equipos.
💲 $15 USD (incluye actualizaciones).
\n
#notion #productividad #gestion #template #digital
```

---

## IV. Sector: Comida/Gastronomía

### 4.1 Perfil del Sector
- **Mercado**: Argentina/LATAM - Restaurantes,Delivery, productos gourmet
- **Audiencia**: Comensales, foodies, empresas para eventos
- **Tono**: Sensorial, directo, evocador sin ser florido
- **CTA típico**: "Pedí", "Reservá", "Probá"

### 4.2 Template: Plato Signature

**Estructura**:
```
[GANCHO - Descripción sensorial]
[INGREDIENTES - Principales]
[POR QUÉ DESTACAR - Diferenciador]
[CTA]
[HASHTAGS]
```

**Example**:
```
Costilla de cerdo braseada 4 hs, con reducción de bourbon y miel.
Acompañamiento: puré de Batata ahumada + verdes asados.
\n
La costilla se deshace sola. El bourbon le da ese toque dulce-ahumado que no se olvida.
\n
🍽️ Reservá tu mesa: [WhatsApp]
Delivery disponible por PedidosYa.
\n
#gastronomia #costilla #bbq #foodporn #bsas
```

**Reglas de Estilo**:
- ❌ NO usar: "vibrante experiencia culinaria"
- ✅ USAR: descripciones concretas de sabor/textura
- ❌ NO usar: "maridaje perfecto"
- ✅ USAR: "va bien con" o "combinación recomendada"

### 4.3 Template: Delivery/Products

**Example**:
```
Picada para 4 personas: tabla de quesos (brie, azul, gouda), fiambres ahumados, frutos secos, miel.
Incluye: pan artesanal, crackers, dips.
\n
Pedila con 24hs de anticipación. Entregamos en CABA y GBA.
📱 [WhatsApp] para pedir.
\n
#picada #quesos #delivery #gastronomia #bsas
```

---

## V. Sector: Estética/Belleza

### 5.1 Perfil del Sector
- **Mercado**: Argentina/LATAM - Salones de belleza, tratamientos estéticos, productos
- **Audiencia**: Mujeres (principal), hombres creciente, todas las edades
- **Tono**: Testimonial, basado en evidencia, confiable
- **CTA típico**: "Reservá tu turno", "Consultá", "Victoria"

### 5.2 Template: Tratamiento

**Estructura**:
```
[GANCHO - Resultado esperado]
[TRATAMIENTO - Qué es y cómo funciona]
[RESULTADOS - Qué obtiene]
[TESTIMONIAL - (opcional) quote]
[CTA]
[HASHTAGS]
```

**Example**:
```
El tratamiento que cambió cómo veo mis manos.
\n
Hydrafacial para manos: limpieza profunda + hidratación intensiva + sérum con vitamina C.
Resultados visibles desde la primera sesión: piel más luminosa, suave, joven.
\n
"De verdad, mis manos parecen de otra persona. Y el precio es accesible."
- María, clienta desde 2023
\n
📱 Reservá tu turno: [WhatsApp]
Primera sesión con 20% de descuento este mes.
#estetica #manos #hydrafacial #tratamiento #belleza
```

### 5.3 Template: Producto

**Example**:
```
Crema con ácido hialurónico - textura liviana, absorbe en 30 segundos.
Sin parabenos, Cruelty-free, Aprobado por ANMAT.
\n
Para uso diario: mañana y noche. Adecuado para todo tipo de piel.
💰 $8.500 ARS | Envíos a todo el país.
\n
#skincare #acidohialuronico #belleza #producto #cuidado
```

---

## VI. Sector: Artículos/Products

### 6.1 Perfil del Sector
- **Mercado**: Argentina/LATAM - E-commerce, productos físicos diversos
- **Audiencia**: Consumidores buscando soluciones, regalos, productos específicos
- **Tono**: Descriptivo, útil, directo
- **CTA típico**: "Comprá", "Pedí", "Visitá la tienda"

### 6.2 Template: Producto Genérico

**Estructura**:
```
[GANCHO - Problema que resuelve]
[PRODUCTO - Qué es y características]
[USO - Para qué sirve]
[PRECIO - Visible]
[CTA]
[HASHTAGS]
```

**Example**:
```
El accesorio que te falta en tu cocina.
\n
Organizador extensible para cajones: ajusta de 30cm a 55cm.
Material: bamboo premium. Resistente al agua.
\n
Mantén tu cocina ordenada: cubiertos, utensilios, servilletas.
💲 $4.200 ARS (Envío gratis a partir de $10.000)
\n
🛒 Comprar ahora: [link]
#cocina #organizador #bamboo #hogar #producto
```

### 6.3 Template: Regalo

**Example**```
Regalo perfecto para el que tiene de todo.
\n
Set de herramientas para celular:destornilladores + imanes + pins + lupa.
Compatible con iPhone, Samsung, Xiaomi.
\n
Para el que le gusta arreglar sus cosas o simplemente tener el kit listo.
📦 Envíos a todo el país.
💲 $3.800 ARS
\n
#regalo #tecnologia #herramientas #gift #producto
```

---

## VII. Validación de Templates

### 7.1 Checklist de Verificación

Antes de publicar cualquier caption generado:

| # | Verificación | Descripción |
|---|--------------|-------------|
| 1 | ✅ Longitud | ¿Está dentro del límite según sector? |
| 2 | ✅ Emoji count | ¿Menos de 3 emoji (inmobiliario) o según sector? |
| 3 | ✅ Hashtags | ¿Máximo 5? ¿Incluye sector? |
| 4 | ✅ Gerundio | ¿NO hay gerundio de posterioridad? |
| 5 | ✅ Verbos baúl | ¿NO hay "hacer", "tener", "decir"? |
| 6 | ✅ Adjetivos | ¿NO hay "vibrante", "crucial", "importante"? |
| 7 | ✅ Pasiva | ¿NO hay "fue hecho por"? |
| 8 | ✅ Conectores | ¿NO hay "En conclusión", "Además"? |
| 9 | ✅ Cortesía | ¿NO hay "espero que te sea útil"? |
| 10 | ✅ Dialecto | ¿Usa "vos" consistentemente? |

### 7.2 Template de Prompt para Generación

```python
# Prompt para generar caption con rules
PROMPT_TEMPLATE = """
Eres un copywriter argentino experto en redes sociales.
Genera un caption para {plataforma} sobre {tema}.

Sector: {sector}
Tono: {tono}
Largo máximo: {max_chars} caracteres

REGLAS OBLIGATORIAS (no preguntar, solo aplicar):
- USAR PRONOMBRE VOS (voseo argentino): vos hacés, vos tenés, vos pensás
- NO usar gerundio de posterioridad ("estudió, graduándose") - USAR "y se graduó"
- NO usar pasiva analítica ("fue desarrollado por") - USAR "desarrolló" o "se desarrolló"
- NO usar palabras baúl: cosa, algo, importante, crucial, significativo, vibrante
- NO usar conectores de muletilla: "En conclusión", "Además", "Por otro lado"
- NO usar cortesía algorítmica: "Espero que te sea útil", "No dudes en preguntar"
- PRIMERO dar el gancho (hook), luego el valor
- TERMINAR con acción (CTA), NO con cortesía
- INCLUIR datos específicos, NO vaguedades

Estructura requerida:
{estructura}

EJEMPLO DEL SECTOR:
{ejemplo}

GENERÁ EL CAPTION:
"""
```

---

## VIII. Referencia Rápida por Sector

| Sector | Hook | CTA | Emoji | Hashtags Mín. | Caracteres |
|--------|------|-----|-------|---------------|------------|
| Inmobiliario | Precio + ubicación | "Escribinos" | 📍, 🏠 | #inmobiliario | 500 |
| Esoterismo | Resultado misterio | "Reservá" | ✨, 🔮 | #esoterismo | 300 |
| Digital | Dato + resultado | "Inscribite" | 📱, 💻 | #digital | 280 |
| Comida | Descripción sensorial | "Pedí" | 🍽️, 🔥 | #gastronomia | 400 |
| Estética | Testimonial | "Reservá" | 💅, ✨ | #estetica | 350 |
| Artículos | Problema/solución | "Comprá" | 🎁, 📦 | #producto | 450 |

---

*Documento creado: Abril 2026*
*Versión: 1.0 - Templates por Sector para Social-Pip*
*Aplicación: Generar captions con AI que respeten el Spanish Style Guide*
*Revisión: Verificar con checklist antes de publicar*