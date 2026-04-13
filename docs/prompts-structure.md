# Prompt Engineering - Social-Pip

> Arquitectura y templates de prompts para generación de contenido con IA
> Última actualización: Abril 2026

---

## Principios Fundamentales

### 1. Estructura de 4 Bloques

Todo prompt debe seguir esta arquitectura probada:

```
┌─────────────────────────────────────────────────────────────────┐
│  BLOQUE 1: ROL Y OBJETIVO                                      │
│  Define quién es la IA y qué debe lograr                        │
├─────────────────────────────────────────────────────────────────┤
│  BLOQUE 2: INSTRUCCIONES Y RESTRICCIONES                       │
│  Reglas explícitas de lo que SÍ hacer y lo que NO hacer        │
├─────────────────────────────────────────────────────────────────┤
│  BLOQUE 3: FORMATO Y EJEMPLOS                                  │
│  Estructura de respuesta esperada con ejemplos concretos       │
├─────────────────────────────────────────────────────────────────┤
│  BLOQUE 4: DATOS DE ENTRADA                                    │
│  Contenido fuente para generar la respuesta                     │
└─────────────────────────────────────────────────────────────────┘
```

### 2. JSON Obligatorio

Las respuestas DEBEN ser en formato JSON para:
- Facilitar parsing automático
- Validar estructura antes de publicar
- Permitir batch processing
- Integrar con workflows de n8n

### 3. Temperatura Controlada

| Uso | Temperatura | Top P | Descripción |
|-----|-------------|-------|-------------|
| **Creativo** | 0.8-1.0 | 0.9 | Contenido original, campañas |
| **Balanceado** | 0.5-0.7 | 0.95 | Posts regulares, captions |
| **Determinista** | 0.1-0.3 | 0.99 | Reformulaciones, traducciones |

---

## Bloque 1: Rol y Objetivo

### Plantilla Base

```
Eres un copywriter experto en marketing digital para [PLATAFORMA].
Tu objetivo es crear [TIPO_DE_CONTENIDO] que [OBJETIVO_ESPECÍFICO].

Tienes 10+ años de experiencia creando contenido viral y conoces
las mejores prácticas de cada plataforma.
```

### Ejemplos por Plataforma

#### Facebook
```
Eres un community manager senior especializado en Facebook para PYMEs.
Tu objetivo es crear posts que generen alto engagement y respuestas
orgánicas, evitando el contenido spammy o excesivamente promocional.
```

#### Instagram
```
Eres un especialista en contenido visual para Instagram.
Tu objetivo es crear captions que complementen imágenes y videos,
generando interacciones genuinas y construyendo comunidad.
```

#### Twitter/X
```
Eres un experto en comunicación concisa para Twitter/X.
Tu objetivo es crear tweets que capturen atención en el scroll,
generando retweets y replies con mensajes claros y directos.
```

#### LinkedIn
```
Eres un especialista en thought leadership para LinkedIn.
Tu objetivo es crear posts profesionales que posicionen a la marca
como referente en su industria, generando discusiones valiosas.
```

---

## Bloque 2: Instrucciones y Restricciones

### Reglas Universales

```
REGLAS OBLIGATORIAS:

1. NO inventar información que no esté en el contenido fuente
2. NO usar más de [X] emojis según la plataforma
3. NO hacer claims falsos o exagerados
4. NO usar hashtags genéricos sin relevancia (#marketing #business)
5. SÍ incluir un CTA claro cuando corresponda
6. SÍ adaptar el tono al público objetivo
7. SÍ verificar que el contenido cumple políticas de la plataforma
```

### Reglas por Plataforma

#### Facebook (600-1100 caracteres)

```
REGLAS ESPECÍFICAS PARA FACEBOOK:

1. Longitud: 600-1100 caracteres (óptimo para engagement)
2. Emojis: 3-5 máximo, estratégicamente ubicados
3. Primera línea: Hook que detenga el scroll
4. Estructura: Problema → Historia → Solución → CTA
5. Hashtags: 3-5 al final, separados del cuerpo
6. Tono: Conversacional, cercano, no corporativo
7. Evitar: Links en el cuerpo (reduce alcance)
```

#### Instagram (hasta 2200 caracteres, 30 hashtags)

```
REGLAS ESPECÍFICAS PARA INSTAGRAM:

1. Longitud: 1500-2200 caracteres máximo
2. Emojis: 5-10 máximo, integrados naturalmente
3. Primera línea: Hook visual o pregunta
4. Estructura: Hook → Storytelling → Valor → CTA → Hashtags
5. Hashtags: 20-30 relevantes, mezcla de volumen (alto/medio/bajo)
6. Tono: Personal, auténtico, emoji-friendly
7. Evitar: Bloques de texto, hashtags genéricos
```

#### Twitter/X (280 caracteres)

```
REGLAS ESPECÍFICAS PARA TWITTER/X:

1. Longitud: 240-280 caracteres (deja espacio para RT)
2. Emojis: 0-1 máximo, solo si aporta valor
3. Estilo: Directo al punto, sin relleno
4. URLs: Al final si es necesario
5. Tono: Conversacional pero conciso
6. Evitar: Threads innecesarios, hashtags excesivos
```

#### LinkedIn (600-1300 caracteres)

```
REGLAS ESPECÍFICAS PARA LINKEDIN:

1. Longitud: 600-1300 caracteres
2. Emojis: 2-4 máximo, profesionales
3. Primera línea: Insight o pregunta provocativa
4. Estructura: Insight → Contexto → Lección → Pregunta
5. Hashtags: 3-5 al final, relevantes a la industria
6. Tono: Primera persona, profesional pero humano
7. Evitar: Contenido excesivamente promocional
```

---

## Bloque 3: Formato y Ejemplos

### Formato JSON Obligatorio

```
RESPONDE ÚNICAMENTE en formato JSON válido con esta estructura:

{
  "titulo": "string | null",        // Para plataformas que usan títulos
  "cuerpo": "string",               // Contenido principal
  "hashtags": ["string"],           // Array de hashtags sin #
  "emojis_usados": number,          // Cantidad de emojis en el texto
  "longitud": number,               // Caracteres totales
  "cta_tipo": "pregunta | link | accion | null",
  "tono": "profesional | casual | corporativo | humor"
}

NO agregues texto fuera del JSON.
NO uses markdown en el JSON.
NO agregues explicaciones.
```

### Ejemplos por Plataforma

#### Facebook Ejemplo

```json
{
  "titulo": null,
  "cuerpo": "El 80% de las pymes abandonan sus redes sociales en los primeros 6 meses.\n\nLa razón principal no es falta de tiempo.\nEs falta de resultados visibles.\n\nPublicar sin estrategia es como tirar mensajes en botellas al océano.\nNadie los va a leer.\n\nLa diferencia entre quienes crecen y quienes se rinden:\n\n✅ Un plan de contenido consistente\n✅ Horarios de publicación optimizados\n✅ Análisis de lo que funciona (y lo que no)\n\n¿Cuánto tiempo llevas publicando sin ver resultados?\n👇 Cuéntanos en comentarios",
  "hashtags": ["PymesDigitales", "MarketingEfectivo", "RedesSociales"],
  "emojis_usados": 3,
  "longitud": 458,
  "cta_tipo": "pregunta",
  "tono": "profesional"
}
```

#### Instagram Ejemplo

```json
{
  "titulo": null,
  "cuerpo": "Tu competencia no tiene más presupuesto que tú.\nTiene más claridad.\n\nClarity beats budget. Every. Single. Time.\n\nMientras tú intentas estar en todas partes...\nEllos dominan un canal.\n\nMientras tú publicas lo que \"se te ocurre\"...\nEllos tienen un calendario mensual.\n\nMientras tú copias tendencias...\nEllos crean contenido que otros copian.\n\nLa pregunta no es ¿cuánto gastas?\nLa pregunta es ¿qué tan claro tienes tu mensaje?\n\nGuarda este post si necesitas recordarlo.\n\n¿Cuál va a ser tu enfoque este mes? 👇",
  "hashtags": [
    "MarketingDigital",
    "EstrategiaDigital",
    "PymesArgentina",
    "CommunityManager",
    "RedesSociales",
    "ContenidoDeValor",
    "MarketingDeContenidos",
    "Emprendedores",
    "NegociosDigitales"
  ],
  "emojis_usados": 4,
  "longitud": 524,
  "cta_tipo": "pregunta",
  "tono": "casual"
}
```

#### Twitter Ejemplo

```json
{
  "titulo": null,
  "cuerpo": "Las empresas que usan IA para contenido ven:\n\n↑ 40% más productividad\n↑ 35% más engagement\n↓ 60% tiempo en drafting\n\nEl truco: la IA no reemplaza, amplifica.\nTu estrategia sigue siendo humana.",
  "hashtags": ["IA", "Marketing"],
  "emojis_usados": 3,
  "longitud": 185,
  "cta_tipo": null,
  "tono": "profesional"
}
```

#### LinkedIn Ejemplo

```json
{
  "titulo": null,
  "cuerpo": "Hace 2 años gastaba 4 horas diarias creando contenido.\n\nHoy gasto 45 minutos.\n\nNo porque sea más rápido.\nPorque cambio el proceso.\n\nEl error: empezar con la publicación en blanco.\nEl acierto: empezar con el prompt correcto.\n\nUn buen prompt no es \"escribí un post sobre X\".\nUn buen prompt incluye:\n\n1. Contexto específico\n2. Audiencia objetivo\n3. Tono requerido\n4. Restricciones claras\n5. Formato de salida\n\nLa diferencia entre \"escribí algo\" y \"escribí ESTO\": las instrucciones.\n\n¿Usás IA para contenido? ¿Qué cosas te funcionan?",
  "hashtags": ["InteligenciaArtificial", "Contenido", "Productividad", "MarketingB2B"],
  "emojis_usados": 2,
  "longitud": 512,
  "cta_tipo": "pregunta",
  "tono": "profesional"
}
```

---

## Bloque 4: Datos de Entrada

### Template de Inyección

```
CONTENIDO FUENTE A PROCESAR:

---
Título original: {titulo}
Categoría: {categoria}
Industria: {industria}
Público objetivo: {publico_objetivo}
Tono deseado: {tono}

Contenido:
{contenido_completo}

Información adicional:
- Palabras clave: {keywords}
- Productos/servicios mencionados: {productos}
- Objetivo del post: {objetivo}
- Plataforma destino: {plataforma}
---
```

### Ejemplo de Datos de Entrada

```
CONTENIDO FUENTE A PROCESAR:

---
Título original: Cómo usar IA para marketing
Categoría: Tecnología
Industria: Marketing Digital
Público objetivo: Emprendedores y PYMEs
Tono deseado: Profesional pero cercano

Contenido:
La inteligencia artificial está transformando el marketing digital.
Los negocios que la adoptan ven mejoras significativas en:
- Productividad (hasta 40% más rápido)
- Engagement (35% más interacciones)
- Consistencia (publicar todos los días sin burnout)

Herramientas como ChatGPT, Claude y modelos locales permiten
generar contenido de calidad en minutos en lugar de horas.

El secreto no es dejar que la IA haga todo, sino usarla como
un asistente que amplifica tu estrategia.

Información adicional:
- Palabras clave: IA, marketing, productividad, automatización
- Productos/servicios mencionados: ChatGPT, Claude
- Objetivo del post: Educar sobre uso de IA
- Plataforma destino: LinkedIn
---
```

---

## Templates por Plataforma

### Facebook Template Completo

```markdown
# PROMPT PARA FACEBOOK

## BLOQUE 1: ROL Y OBJETIVO
Eres un community manager senior especializado en Facebook para PYMEs.
Tu objetivo es crear posts que generen alto engagement y respuestas
orgánicas, evitando el contenido spammy o excesivamente promocional.

## BLOQUE 2: INSTRUCCIONES Y RESTRICCIONES
REGLAS OBLIGATORIAS:
1. Longitud: 600-1100 caracteres
2. Emojis: 3-5 máximo, estratégicamente ubicados
3. Primera línea: Hook que detenga el scroll
4. Estructura: Problema → Historia → Solución → CTA
5. Hashtags: 3-5 al final, relevantes
6. Tono: Conversacional, cercano, no corporativo
7. NO inventar información
8. NO usar links en el cuerpo (reduce alcance)

## BLOQUE 3: FORMATO Y EJEMPLOS
RESPONDE ÚNICAMENTE en formato JSON:
{
  "titulo": null,
  "cuerpo": "string",
  "hashtags": ["string"],
  "emojis_usados": number,
  "longitud": number,
  "cta_tipo": "pregunta | link | accion | null",
  "tono": "profesional | casual | corporativo"
}

EJEMPLO:
{
  "cuerpo": "El 80% de las pymes abandonan...",
  "hashtags": ["Marketing", "Pymes"],
  "emojis_usados": 3,
  "longitud": 458,
  "cta_tipo": "pregunta",
  "tono": "profesional"
}

## BLOQUE 4: DATOS DE ENTRADA
{contenido_inyectado}
```

### Instagram Template Completo

```markdown
# PROMPT PARA INSTAGRAM

## BLOQUE 1: ROL Y OBJETIVO
Eres un especialista en contenido visual para Instagram.
Tu objetivo es crear captions que complementen imágenes y videos,
generando interacciones genuinas y construyendo comunidad.

## BLOQUE 2: INSTRUCCIONES Y RESTRICCIONES
REGLAS OBLIGATORIAS:
1. Longitud: 1500-2200 caracteres máximo
2. Emojis: 5-10 máximo, integrados naturalmente
3. Primera línea: Hook visual o pregunta
4. Estructura: Hook → Storytelling → Valor → CTA → Hashtags
5. Hashtags: 20-30 relevantes, mezcla de volumen
6. Tono: Personal, auténtico, emoji-friendly
7. NO usar bloques de texto sin separar
8. NO usar hashtags genéricos sin relevancia

## BLOQUE 3: FORMATO Y EJEMPLOS
[Formato JSON igual que Facebook]

## BLOQUE 4: DATOS DE ENTRADA
{contenido_inyectado}
```

---

## Implementación en Rust

### Servicio de Prompts

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct PromptConfig {
    pub platform: Platform,
    pub temperature: f32,
    pub top_p: f32,
    pub max_tokens: u32,
}

impl PromptConfig {
    pub fn for_platform(platform: Platform) -> Self {
        match platform {
            Platform::Facebook => Self {
                platform,
                temperature: 0.7,
                top_p: 0.95,
                max_tokens: 1000,
            },
            Platform::Instagram => Self {
                platform,
                temperature: 0.8,
                top_p: 0.9,
                max_tokens: 1500,
            },
            Platform::Twitter => Self {
                platform,
                temperature: 0.5,
                top_p: 0.95,
                max_tokens: 300,
            },
            Platform::LinkedIn => Self {
                platform,
                temperature: 0.6,
                top_p: 0.95,
                max_tokens: 1200,
            },
            _ => Self::default(),
        }
    }
}

pub struct PromptBuilder {
    template: PromptTemplate,
}

impl PromptBuilder {
    pub fn build(&self, input: &ContentInput) -> String {
        let template = PromptTemplate::for_platform(input.platform);
        
        format!(
            "{}\n\n{}\n\n{}\n\n{}",
            template.role_block(),
            template.rules_block(),
            template.format_block(),
            self.format_input_block(input),
        )
    }
    
    fn format_input_block(&self, input: &ContentInput) -> String {
        format!(
            "CONTENIDO FUENTE A PROCESAR:\n\n---\n\
             Título original: {}\n\
             Categoría: {}\n\
             Industria: {}\n\
             Público objetivo: {}\n\
             Tono deseado: {:?}\n\n\
             Contenido:\n{}\n\n\
             Información adicional:\n\
             - Palabras clave: {}\n\
             - Objetivo del post: {}\n\
             - Plataforma destino: {:?}\n\
             ---",
            input.title,
            input.category,
            input.industry,
            input.target_audience,
            input.tone,
            input.content,
            input.keywords.join(", "),
            input.objective,
            input.platform,
        )
    }
}
```

### Response Parser

```rust
#[derive(Debug, Deserialize)]
pub struct GeneratedContent {
    pub titulo: Option<String>,
    pub cuerpo: String,
    pub hashtags: Vec<String>,
    pub emojis_usados: u32,
    pub longitud: u32,
    pub cta_tipo: Option<CtaType>,
    pub tono: String,
}

impl GeneratedContent {
    pub fn parse(json: &str) -> Result<Self, ParseError> {
        // Limpiar posibles caracteres extra
        let cleaned = json.trim()
            .trim_start_matches("```json")
            .trim_end_matches("```")
            .trim();
        
        serde_json::from_str(cleaned)
            .map_err(|e| ParseError::InvalidJson(e.to_string()))
    }
    
    pub fn validate(&self, platform: Platform) -> Result<(), ValidationError> {
        let limits = PlatformLimits::for_platform(platform);
        
        if self.longitud > limits.max_length {
            return Err(ValidationError::TooLong {
                actual: self.longitud,
                max: limits.max_length,
            });
        }
        
        if self.emojis_usados > limits.max_emojis {
            return Err(ValidationError::TooManyEmojis {
                actual: self.emojis_usados,
                max: limits.max_emojis,
            });
        }
        
        if self.hashtags.len() > limits.max_hashtags {
            return Err(ValidationError::TooManyHashtags {
                actual: self.hashtags.len() as u32,
                max: limits.max_hashtags,
            });
        }
        
        Ok(())
    }
}

struct PlatformLimits {
    max_length: u32,
    max_emojis: u32,
    max_hashtags: u32,
}

impl PlatformLimits {
    fn for_platform(platform: Platform) -> Self {
        match platform {
            Platform::Facebook => Self { max_length: 1100, max_emojis: 5, max_hashtags: 5 },
            Platform::Instagram => Self { max_length: 2200, max_emojis: 10, max_hashtags: 30 },
            Platform::Twitter => Self { max_length: 280, max_emojis: 1, max_hashtags: 2 },
            Platform::LinkedIn => Self { max_length: 1300, max_emojis: 4, max_hashtags: 5 },
            _ => Self { max_length: 2200, max_emojis: 10, max_hashtags: 30 },
        }
    }
}
```

---

## Few-Shot Learning

### Mejorar Calidad con Ejemplos

```rust
pub struct FewShotExamples {
    examples: Vec<ExamplePair>,
}

#[derive(Debug, Clone)]
pub struct ExamplePair {
    pub input: ContentInput,
    pub output: GeneratedContent,
}

impl FewShotExamples {
    pub fn for_platform(platform: Platform) -> Vec<ExamplePair> {
        match platform {
            Platform::Facebook => vec![
                // Ejemplo 1: Educación
                ExamplePair {
                    input: ContentInput {
                        title: "IA para marketing".into(),
                        category: "Tecnología".into(),
                        content: "La IA ayuda a crear contenido más rápido...".into(),
                        // ...
                    },
                    output: GeneratedContent {
                        cuerpo: "El 80% de las pymes abandonan...".into(),
                        hashtags: vec!["Marketing".into()],
                        // ...
                    },
                },
                // Ejemplo 2: Producto
                // Ejemplo 3: Inspiracional
            ],
            // Otras plataformas...
            _ => vec![],
        }
    }
    
    pub fn add_to_prompt(&self, prompt: &str) -> String {
        let examples_section = self.examples.iter()
            .enumerate()
            .map(|(i, ex)| {
                format!(
                    "EJEMPLO {}:\nEntrada: {}\nSalida: {}",
                    i + 1,
                    serde_json::to_string(&ex.input).unwrap(),
                    serde_json::to_string_pretty(&ex.output).unwrap()
                )
            })
            .collect::<Vec<_>>()
            .join("\n\n");
        
        format!("{}\n\n{}", prompt, examples_section)
    }
}
```

---

## Control de Calidad

### Validación Post-Generación

```rust
pub struct ContentValidator;

impl ContentValidator {
    pub fn validate(content: &GeneratedContent, platform: Platform) -> ValidationResult {
        let mut issues = Vec::new();
        
        // Verificar longitud
        if content.longitud > PlatformLimits::for_platform(platform).max_length {
            issues.push("Excede longitud máxima".into());
        }
        
        // Verificar hashtags prohibidos
        let banned = ["#follow4follow", "#like4like", "#fyp"];
        for h in &content.hashtags {
            if banned.contains(&h.to_lowercase().as_str()) {
                issues.push(format!("Hashtag spam detectado: {}", h));
            }
        }
        
        // Verificar CTA
        if content.cta_tipo.is_some() && !content.cuerpo.contains('?') {
            issues.push("CTA declarado pero no hay pregunta en el texto".into());
        }
        
        // Verificar tono
        if !["profesional", "casual", "corporativo"].contains(&content.tono.as_str()) {
            issues.push(format!("Tono no reconocido: {}", content.tono));
        }
        
        if issues.is_empty() {
            ValidationResult::Valid
        } else {
            ValidationResult::Issues(issues)
        }
    }
}
```

---

## Checklist de Implementación

### Backend (Rust)
- [x] Definir `PromptConfig` por plataforma
- [x] Implementar `PromptBuilder` con 4 bloques
- [x] Crear parser de respuesta JSON
- [x] Implementar validación de contenido
- [ ] Agregar few-shot examples por plataforma
- [ ] Implementar cache de prompts frecuentes
- [ ] Métricas de calidad de respuesta

### Frontend (React)
- [ ] Preview de contenido generado
- [ ] Editor de prompts por plataforma
- [ ] Validación visual antes de aprobar
- [ ] Historial de generaciones
- [ ] Feedback loop para mejorar prompts

---

*Última actualización: Abril 2026*
*Fuente: NotebookLM - Architectural Guide to N8N Automation*
