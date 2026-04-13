# Facebook Marketplace — Consideraciones para Argentina/Latam

## Layout por Región

Facebook Marketplace cambia su layout según el país/región. Esto es CRÍTICO para la automatización.

### Argentina/Latam
- Layout similar a otros países de Latam
- Diferente al de US/Europa
- URLs: facebook.com/marketplace (redirige a versión local)
- Idioma: Español
- Moneda: ARS (pesos argentinos)

### Limitaciones Conocidas
- El repo HARON416 está optimizado para Kenya
- NO funciona en US por diferencias de layout
- Necesitamos adaptar selectores CSS para Argentina

## Campos de un Listing en Marketplace

### Campos Obligatorios
1. **Título** (máx 100 caracteres)
2. **Precio** (número)
3. **Categoría** (dropdown)
4. **Condición** (Nuevo/Usado)

### Campos Opcionales
5. **Descripción** (texto largo)
6. **Imágenes** (múltiples, hasta 10)
7. **Tags/Etiquetas**
8. **Ubicación** (se toma del perfil)

### Categorías Comunes por Sector

#### Inmobiliario
- Alquileres → Departamentos, Casas, Habitaciones
- Ventas → Departamentos, Casas, Terrenos

#### Artículos
- Electrónica → Celulares, Computadoras, Consolas
- Vehículos → Autos, Motos, Repuestos
- Hogar → Muebles, Electrodomésticos
- Ropa y Accesorios

#### Comida
- No tiene categoría específica
- Se publica en "Varios" o "Hogar"

#### Estética
- No tiene categoría específica
- Se publica como "Servicios" (si disponible) o "Varios"

#### Digital
- No tiene categoría específica
- Se publica en "Electrónica" o "Varios"

## Flujo de Publicación en Marketplace

1. Navegar a facebook.com/marketplace
2. Click en "Crear publicación" / "Vender"
3. Seleccionar tipo: "Artículo" o "Vehículo"
4. Completar formulario:
   - Subir fotos (drag & drop o file picker)
   - Título
   - Precio
   - Categoría
   - Condición
   - Descripción
   - Tags
5. Click en "Publicar"

## Selectores CSS (a verificar para Argentina)

> ⚠️ Estos selectores deben verificarse en la versión argentina de Facebook.
> Facebook cambia selectores frecuentemente.

```
# Botón crear publicación
button[aria-label="Crear publicación"]
a[href*="/marketplace/sell"]

# Upload de imágenes
input[type="file"][accept*="image"]

# Campo título
input[aria-label="Título"]
input[placeholder*="título"]

# Campo precio
input[aria-label="Precio"]

# Campo descripción
textarea[aria-label="Descripción"]

# Dropdown categoría
[role="listbox"][aria-label*="Categoría"]

# Botón condición
[role="radio"][aria-label*="Nuevo"]
[role="radio"][aria-label*="Usado"]

# Botón publicar
button[aria-label*="Publicar"]
button[type="submit"]
```

## Límites de Marketplace

- **Listings activos**: ~100 por cuenta (varía)
- **Listings por día**: 5-10 recomendado
- **Renovación**: Cada 7 días (auto o manual)
- **Imágenes por listing**: Hasta 10

## Novedades Marzo 2026

Meta agregó funciones de IA a Marketplace en Latam:
- Respuestas automáticas a compradores
- Sugerencia de precios
- Perfiles de vendedor mejorados

Esto NO afecta la publicación automática pero puede cambiar el flujo de mensajes.

## Consideraciones Especiales para Argentina

1. **Moneda**: Pesos argentinos (ARS) — formato: $1.000, $10.000
2. **Idioma**: Español — todos los selectores aria-label en español
3. **Categorías**: Pueden diferir de US/Europa
4. **Zonas**: Sistema de ubicación por barrio/zona
