# Spanish Style Guide para Contenido Generado por IA
> Parte de: [[README]] · Relacionados: [[prompts-structure]]

## Resumen

Este documento establece las **reglas gramaticales, léxicas y estilísticas** que debe seguir toda la generación de contenido textual en Social-Pip. El objetivo es evitar las "huellas verbales" características de la IA y producir textos que suenen genuinamente escritos por un humano hispanohablante.

Este guide es de referencia para:
- `src-tauri/src/ai_service.rs` (generación de captions)
- `workflows/templates-workflows.md` (Manual de Marca)
- `workflows/social-pip-workflows.md` (content generation)
- Cualquier prompt que genere texto en español

---

## I. Morfosintaxis: La Estructura del Español

### 1.1 Consecutio Temporum (Secuencia de Tiempos)

**El Problema**: La IA mezcla tiempos verbales del indicativo y subjuntivo de forma errática, creando anacronismos sintácticos.

**La Regla**: Si el verbo principal está en pasado, el subordinado debe seguir la concordancia temporal.

| Verbo Principal | Verbo Subordinado Correcto | Incorrecto |
|----------------|---------------------------|------------|
| Pedí | que **viniera** | que venga |
| Advertí | que **había** | que tiene |
| Supuse | que **sería** | que será |
| Deseaba | que **pudiera** | que puede |

**Aplicación en Prompts**:
```python
# INCORRECTO (IA típicas)
"Write: 'Le pedí que comparte su experiencia'"

# CORRECTO
"Write: 'Le pedí que compartiera su experiencia'"
```

**Instrucción para el Agente**: En todos los prompts de generación, incluir:
```
{Uso estricto de la consecutio temporum: si el verbo principal está en pasado,
el subordinado debe concordar (pasado del subjuntivo, no presente).}
```

---

### 1.2 El Gerundio: Prohibiciones Absolutas

**El Problema**: La IAabusa del gerundio de posterioridad y del gerundio adjetivo, generando errores que suenan a "traducción automática".

#### 1.2.1 Gerundio de Posterioridad (Prohibido)

**Error Típico**: "Estudió la carrera, graduándose años después"

**Corrección**: "Estudió la carrera y se graduó años después" o "Estudió la carrera; años después, se graduó"

#### 1.2.2 Gerundio Adjetivo (Prohibido, excepto casos RAE)

**Error Típico**: "La caja conteniendo libros fue hallada"

**Corrección**: "La caja que contenía libros fue hallada" o "La caja con libros fue hallada"

**Casos Exceptuados por la RAE** (usar con moderación):
- Formas pasivas con participio: "siendo analizado", "habiendo sido aprobado"
- Verbos de percepción seguidos de participio: "vi caer el vaso", "sentí llegar el tren"
- Los casos de "hirviendo", "ardiendo" como adjetivos pospuestos: "agua hirviendo", "casa ardiendo"

**Instrucción para el Agente**:
```
{Prohibición absoluta del gerundio de posterioridad.
Prohibición del gerundio adjetivo excepto casos RAE.
El gerundio expresa simultaneidad o modo, nunca posterioridad.}
```

---

### 1.3 La Pasiva Refleja vs. Pasiva Analítica

**El Problema**: La IAabusa de la pasiva analítica ("ser + participio"), que es un calco del inglés que drena energía del texto.

**Ejemplos de Deterioro**:
- "La decisión fue tomada por el comité" ❌
- "Se tomó la decisión" ✅
- "El comité tomó la decisión" ✅

**La Regla**: Priorizar siempre la voz activa o, en su defecto, la pasiva refleja ("se hizo", "se decidió").

**Tabla de Equivalencias**:

| Pasiva Analítica (Inglés) | Pasiva Refleja (Español) |
|---------------------------|---------------------------|
| Fue descubierto por... | Se descubrió |
| Fue implementado por... | Se implementó |
| Fue escrito por... | Se escribió |
| Es considerado como... | Se considera |
| Fue creado para... | Se creó para |

**Instrucción para el Agente**:
```
{Preferir voz activa sobre pasiva analítica.
Si se usa pasiva, debe ser pasiva refleja (se + verbo).
Evitar "fue realizado por", usar "realizó" o "se realizó".}
```

---

### 1.4 El Régimen Preposicional

**El Problema**: La IA genera errores de régimen (queísmo y dequeísmo) y confusión con preposiciones.

#### Errores Comunes:

| Error | Correcto |
|-------|----------|
| "Me voy a ir" | "Me voy" (no es "a ir") |
| "Es mejor que vengas" | No es dequeísmo aquí |
| "De que sirve" | "¿De qué sirve?" |
| "El hecho de que" | "El hecho de que" (correcto) |
| "A pesar de que" | "Aunque" o "a pesar de que" |

**Casos de Régimen Fijo** (memorizar):
- Acordar **de** (no "sobre")
- Asistir **a** (no "en")
- Consistir **en** (no "de")
- Depender **de** (no "de que")
- Impedir **que** (no "de que")
-istar **de** (no "de que")

**Instrucción para el Agente**:
```
{Verificar régimen preposicional de cada verbo.
Evitar dequeísmo y queísmo.
Consultar: https://www.rae.es/}

```

---

## II. Puntuación: El Ritmo del Español

### 2.1 La "Coma Criminal"

**El Problema**: La IA coloca una coma entre el sujeto y el verbo cuando el sujeto es largo.

**Error Típico**: "El análisis de los datos recabados durante el último trimestre, demuestra que..."

**La Regla de Oro**: **Nunca** separar el sujeto del predicado con una coma, sin importar cuán larga sea la frase.

**Correcciones**:

| Con Coma Criminal | Corrección |
|-------------------|-------------|
| "Los resultados obtenidos de la investigación exhaustiva sobre el comportamiento del mercado en los últimos tres años, demuestran que..." | "Los resultados obtenidos de la investigación exhaustiva sobre el comportamiento del mercado en los últimos tres años demuestran que..." |
| "El equipo de profesionales altamente capacitados en el manejo de tecnologías emergentes, ha implementado..." | "El equipo de profesionales altamente capacitados en el manejo de tecnologías emergentes ha implementado..." |

**Excepción**: Solo cuando hay un **inciso** claro entre comas que interrumpe el flujo.

---

### 2.2 Puntuación de Incisos: La Raya (—)

**El Problema**: La IA usa guiones cortos (-) o comas para incisos, cuando debería usar la raya.

**La Norma**: Los incisos que interrumpen el discurso con una **aclaración fuerte** deben usar la raya (—), pegada a la primera y última palabra del inciso.

**Ejemplos**:

| Incorrecto (coma/guion) | Correcto (raya) |
|------------------------|------------------|
| "El proyecto -que empezó en 2020- fue un éxito" | "El proyecto —que empezó en 2020— fue un éxito" |
| "Los datos, como se mencionó antes, confirman la tendencia" | "Los datos —como se mencionó antes— confirman la tendencia" |

**Casos de Uso de la Raya**:
- Aclaración importante
- Paréntesis con énfasis
- Inciso que interrumpe el flujo narrativo
- Explicación de un término

**No usar rayas para**:
- Enumeraciones simples (usar comas o punto y coma)
- Información secundaria menor (usar paréntesis)

---

### 2.3 El Punto y Coma (;) - Signo de Madurez Intelectual

**El Problema**: La IA abusa del punto seguido. El punto y coma es el signo de la madurez argumentativa.

**La Regla**: Usar punto y coma para:
1. Separar elementos de una enumeración compleja
2. Vincular dos proposiciones que contrastan sin usar conectores
3. Separar oraciones sintácticamente independientes pero vinculadas por el sentido

**Ejemplos de Uso**:

```markdown
La estrategia funciona en teoría; en la práctica, requiere ajustes.
No se trata de publicar más; se trata de publicar mejor.
El mercado cambió: los usuarios prefieren contenido auténtico; las marcas adaptarse.
```

**Instrucción para el Agente**:
```
{Usar punto y coma para contrastar ideas sin conectores.
No abusar del punto seguido.
El punto y coma marca la pausa del pensador, no del robot.}
```

---

## III. Precisión Léxica: Erradicar el Cosismo

### 3.1 Palabras Baúl (Verbos)

**El Problema**: La IA usa verbos genéricos que no aportan información específica.

**Tabla de Sustitución Obligatoria**:

| Verbo Baúl | Sustitutos Precisos |
|------------|---------------------|
| **Hacer** | Ejecutar, desarrollar, implementar, crear, realizar, provocar, causar |
| **Tener** | Poseer, albergrar, contener, experimentar, sentir, constar |
| **Decir** | Exponer, manifestar, sostener, señalar, indicar, afirmar, comunicar |
| **Poner** | Instalar, colocar, establecer, configurar, iniciar, disponer |
| **Dar** | Otorgar, proporcionar, entregar, facilitar, conceder, aportar |
| **Ver** | Observar, percibir, contemplar, examinar, revisar, constatar |
| **Llegar** | Acceder, alcanzar, obtener, presentarse, surgir |

**Ejemplos de Corrección**:

| Baúl | Correcto |
|------|----------|
| "Hace un proyecto" | "Ejecuta un proyecto" |
| "Tiene dudas" | "Alberga dudas" |
| "Da información" | "Proporciona información" |
| "Vio el problema" | "Percibió el problema" |

---

### 3.2 Palabras Baúl (Sustantivos y Adjetivos)

**El Problema**: La IA usa términos comodín que suenan bien pero no dicen nada.

**Tabla de Erradicación**:

| Adjetivo/Sustantivo Baúl | Alternativas Concretas |
|--------------------------|------------------------|
| **Cosa** | Elemento, aspecto, factor, matter, elemento |
| **Algo** | Cierto elemento, una cuestión, un punto |
| **Aspecto importante** | Factor crítico, dimensión relevante, matiz clave |
| **Algo significativo** | Un dato clave, un hallazgo, una tendencia |
| **Muy importante** | Crucial, decisive, prioritario, crítico |
| **Diverso** | Múltiple, variados, heterogéneo, amplio |
| **Vibrante** | Dinámico, energético, vivo, enérgico |
| **Intrincado** | Complejo, sofisticado, detallado, nudoso |

**Instrucción para el Agente**:
```
{Nunca usar: cosa, algo, hacer, tener, decir, poner, muy, diverso, vibrante, crucial, significativo, importante.
Sustituir por términos específicos del dominio.}
```

---

### 3.3 Adjetivación: Posición y Valor

**El Problema**: La IA siempre pone el adjetivo después del sustantivo (estilo funcional), creando textos planos.

**La Regla**:
- **Adjetivo pospuesto** (sustantivo + adjetivo): Especificativo. "La noche oscura" = especifica cuál noche.
- **Adjetivo antepuesto** (adjetivo + sustantivo): Valorativo/subjetivo. "La oscura noche" = evoca atmósfera.

**Ejemplos de Uso**:

| Posición | Efecto |
|----------|--------|
| "La decisión importante" | Especifica cuál decisión |
| "La importante decisión" | Subraya la relevancia |
| "El resultado inesperado" | Describe el resultado |
| "El inesperado resultado" | Sugiere sorpresa |

**Instrucción para el Agente**:
```
{Alternar posición del adjetivo para evitar monotonía.
Anteponer para énfasis emocional o poético.
Posponer para precisión técnica.}
```

---

## IV. Estilo: Evitar la "Huella de IA"

### 4.1 Estructura de Sándwich (Prohibida)

**El Problema**: La IA usa la estructura "Introducción = Conclusión + Lista de puntos + Conclusión repetida".

**La Regla**: Cada sección debe fluir de la anterior. No repetir la conclusión al inicio.

**Patrón a Evitar**:
```
En conclusión, [resumen].
1. Punto uno
2. Punto dos
3. Punto tres
En conclusión, [repetición del resumen].
```

**Patrón Correcto**:
```
[Punto de entrada directo]
1. Punto uno
2. Punto dos
[Transición natural al cierre]
[Final sin repetir introducción]
```

---

### 4.2 Conectores de Muletilla (Prohibidos)

**El Problema**: La IAabusa de conectores explícitos que guidan al lector de forma infantil.

**Lista de Conectores Prohibidos al Inicio de Párrafo**:
- "En conclusión" →Eliminar, dejar que el cierre hable solo
- "Además" → Usar "también" dentro de la oración
- "Por otro lado" → Eliminar, usar "también"
- "En consecuencia" → Usar "así" o "entonces"
- "Finalmente" → Usar "por último" dentro de la oración
- "Por último" → Eliminar

**La Regla**: La cohesión se logra mediante el orden lógico de las ideas. Si un párrafo sigue al otro, se sobreentiende que es adición o consecuencia.

---

### 4.3 El Falso Contraste (Prohibido)

**El Problema**: La muletilla "No es solo A, sino también B" o "No se trata de A, sino de B".

**Ejemplos de Eliminación**:

| Falso Contraste | Corrección |
|-----------------|------------|
| "No es solo el precio, sino también la calidad" | "El precio y la calidad son ambos relevantes" |
| "No se trata de cantidad, sino de calidad" | "La calidad importa más que la cantidad" |

---

### 4.4 Vaguedad Elegante (Fluff)

**El Problema**: Párrafos que suenan bien pero no contienen datos, nombres propios ni hechos concretos.

**La Regla**: Todo párrafo debe incluir:
- Al menos un dato específico
- Un nombre propio o caso real
- Un hecho verificable

**Ejemplo de Fluff**:
"En el mundo actual, las empresas enfrentan múltiples desafíos que requieren soluciones innovadoras..."

**Versión con Datos**:
"En 2025, las PYMES argentinas que automatizaron sus flujos de trabajo con n8n redujeron un 40% sus tiempos de ejecución..."

---

### 4.5 Conclusión Armonizadora (Prohibida)

**El Problema**: La IA tiene la necesidad compulsiva de terminar todo con una nota positiva, conciliadora o moralista.

**La Regla**: El cierre puede ser:
--neutral (presentar hallazgos sin juicio)
- acids (crítico, irónico)
- abierto (invitar a reflexión)

**Nunca** terminar con:
- "Espero que esta información te sea útil"
- "Gracias por tu atención"
- "¡Éxito en tu camino!"
- " Juntos podemos lograr..."

---

## V. Pragmática 2026: El Español Post-IA

### 5.1 Sesgo de Cordialidad Algorítmica (Prohibido)

**El Problema**: En 2026, la mayor delación de una IA es su exceso de cortesía.

**Frases Prohibidas**:
- "Espero que esta información te sea útil"
- "No dudes en preguntar si tienes dudas"
- "Quedo a tu disposición"
- "Fue un placer ayudarte"
- "Si necesitas algo más, aquí estaré"

**La Regla**: Un autor de blog en 2026 es **directo**. La autoridad se demuestra con datos y estilo, no con servilismo.

---

### 5.2 La Trampa del SEO Sintético (Prohibido)

**El Problema**: La IA escribe pensando en motores de búsqueda de 2020.

**Prácticas Prohibidas**:
- Repetir el título en el primer párrafo
- Usar la palabra clave más de 3 veces
- Escribir introducción genérica tipo "En el mundo de hoy..."

**La Regla 2026**: Escritura orientada a la **intención del usuario**. Saltar directamente al conflicto o al valor añadido.

**Introducción Correcta**:
"En 2023, el 73% de las campañas de marketing automatizado fallaron. Esta es la razón."

**Introducción Prohibida**:
"En el mundo del marketing digital actual, es importante considerar..."

---

### 5.3 Español Neutro Falso (Evitar)

**El Problema**: La IA escribe en un español que no suena a ningún lugar: mezcla estéril de mexicano, español peninsular y traducciones de California.

**La Regla**: Definir un **geo-lecto** y mantenerlo consistente.

| Para Social-Pip (Argentina/LATAM) | Regla |
|----------------------------------|-------|
| Pronombre | Usar "vos" (voseo) consistentemente |
| Verbos | "Vos hacés", "Vos sos", "Vos pensás" |
| Léxico | Usar argentinismos cuando sea natural |
| Vocabulario | "Computadora" (no "ordenador"), "celular" (no "móvil") |

**Nunca mezclar**:
- "Vos sos" con "tú eres"
- "Mucho" con "tan"
- "Bolivia" con "vosotros"

---

## VI. Geopolítica del Lenguaje: Social-Pip en LATAM

### 6.1 Convenciones para Argentina/Cono Sur

**Reglas Específicas**:

| Aspecto | Norma LATAM |
|--------|-------------|
| Pronombre | **Vos** (no "tú" ni "usted") |
| Verbos | Terminación -ás, -és, -ís (vos hacés, vos ves) |
| Pretérito | "Fui", "estuve", "tuve" (no "fuera") |
| Imperativo | "Hacé", "Mirá", "Escuchá" |
| Possessivos | "Tu" (sin tilde; "tú" solo como pronombre sujeto) |

### 6.2 Vocabulario LATAM vs. Español

| Español de España | Español LATAM (Usar) |
|-------------------|---------------------|
| Ordenador | Computadora |
| Móvil | Celular |
| Correo electrónico | Email, mail |
| Ordenador | Computadora |
| Fecha de nacimiento | Fecha de nacimiento |
| Informático | Técnico, especialist |

---

## VII. Por Plataforma: El Registro Apropiado

### 7.1 Twitter/X: El Aforismo y la Provocación

**El Problema**: La IA es demasiado explicativa. Un humano en 2026 es elíptico y usa la economía del lenguaje.

**Reglas**:
- ❌ Prohibido: Empezar con "En el mundo de hoy..." o "Hablemos de..."
- ❌ Prohibido: Usar hilos de "10 herramientas de IA"
- ✅ Obligatorio: Usar elipsis y frases nominales
- ✅ Obligatorio: Ser asertivo o cínico

**Ejemplo de Caption Humano**:
```
La mayoría sigue usando el gerundio de posterioridad como si no doliera.
Spoiler: duele.
Si vas a escribir, que sea para aportar algo, no para parafrasear la Wikipedia con emojis.
```

**Ejemplo IA (Prohibido)**:
```
Hoy vamos a hablar sobre la importancia de escribir bien en español.
Aquí te dejo 10 tips para mejorar tu escritura...
```

### 7.2 Instagram: El Gancho (Hook)

**Reglas**:
- ❌ Prohibido: Usar "vibrante", "mágico", "increíble", listas de 5 puntos con Title Case
- ❌ Prohibido: Emojis excesivos (máximo 3 por post)
- ✅ Obligatorio: Primera frase como bofetón ("Hook")
- ✅ Obligatorio: Adjetivación antepuesta para generar impacto

**Ejemplo de Hook**:
```
Me tomó tres años entender que menos es más.
No se trata de publicar por publicar, sino de tener algo que decir cuando nadie está escuchando.
```

### 7.3 LinkedIn: El Insight sin Moralina

**Reglas**:
- ❌ Prohibido: "En última instancia...", "Reflexionemos sobre...", "Es imperativo fomentar..."
- ❌ Prohibido: Terminar con consejos moralistas
- ✅ Obligatorio: Uso de pasiva refleja para cuestionar mitos
- ✅ Obligatorio: Punto y coma para listas de ideas complejas
- ✅ Obligatorio: Autoridad técnica. Hablar desde el error, no desde el éxito prefabricado

**Ejemplo**:
"La innovación no es un KPI; es lo que queda cuando dejas de seguir el manual. He visto equipos enteros hundirse por seguir 'procesos optimizados' que no entendían el mercado local."

### 7.4 Reddit: El Peer-to-Peer y la Especificidad

**Reglas**:
- ❌ Prohibido: "Como modelo de lenguaje...", "Es importante considerar ambos lados..."
- ❌ Prohibido: Ser neutral o equidistante
- ✅ Obligatorio: Usar rayas (—) para incisos sarcásticos
- ✅ Obligativo: Usar segunda persona (vos/tú) según región
- ✅ Obligatorio: Jerga específica del subreddit

**Ejemplo**:
"A ver, el OP tiene razón a medias. Si revisas la documentación —la de verdad, no el resumen de la web— verás que el error viene por un conflicto de librerías. No es 'magia', es falta de lectura técnica."

### 7.5 Facebook: El Storytelling y la Cercanía

**Reglas**:
- ❌ Prohibido: Listas con viñetas en cada post
- ❌ Prohibido: Estructura de sándwich
- ❌ Prohibido: Lenguaje administrativo ("mismismo")
- ✅ Obligatorio: Variación sintáctica (oraciones largas + oraciones de dos palabras)
- ✅ Obligatorio: Sujeto tácito para sonar natural

**Ejemplo**:
"Ayer volví al barrio. Todo sigue igual, pero el aire se siente distinto. Me crucé con el viejo librero y me dijo algo que me desarmó: 'Escribir es recordar lo que otros quieren olvidar'. Me dejó pensando toda la tarde."

---

## VIII. Matriz de Aplicación para Social-Pip

### 8.1 Prompts de Generación de Contenido

**Template Base**:
```
Eres un escritor profesional argentino especializado en [sector].
Genera un caption para [plataforma] sobre [tema].

Reglas strictas:
- NO usar gerundio de posterioridad
- NO usar "importante", "crucial", "vibrante", "significativo"
- Usar voz activa, NO pasiva analítica
- Usar pronombre "vos" (voseo argentino)
- Primero dar el gancho, luego el valor
- Terminar con acción, NO con cortesía
- Incluir datos específicos, NO vaguedades
- Máximo [X] caracteres
- Incluye [emoji permitidos] si aplica
- Hashtags: [lista requerida]
```

### 8.2 Validación de Contenido

**Checklist Automático**:
- [ ] ¿Hay gerundio de posterioridad? → Eliminar
- [ ] ¿Hay verbos baúl (hacer, tener, decir)? → Sustituir
- [ ] ¿Hay pasiva analítica ("fue hecho por")? → Cambiar a voz activa
- [ ] ¿Hay conectores de muletilla al inicio? → Eliminar
- [ ] ¿Hay cortesía algorítmica? → Eliminar
- [ ] ¿Hay español neutro falso? → Ajustar a dialecto
- [ ] ¿Hay conclusiones moralistas? → Cambiar a cierre neutral

### 8.3 Por Sector en Social-Pip

| Sector | Tono | Longitud Máxima | Emoji Permitidos | Hashtags Requeridos |
|--------|------|-----------------|------------------|---------------------|
| Inmobiliario | Profesional, directo | 500 | 📍, 🏠, ✅, 💰 | #inmobiliario #propiedad |
| Esoterismo | Misterio, no dramático | 300 | ✨, 🔮, 🌙, 🔥 | #esoterismo #spiritualidad |
| Digital | Técnico, asertivo | 280 | 📱, 💻, 🎯, ⚡ | #digital #tech #innovacion |
| Comida | Sensorial, directo | 400 | 🍽️, 🔥, ✅ | #gastronomia #foodporn |
| Estética | Testimonial, evidencia | 350 | 💅, ✨, 📸, 🔥 | #estetica #belleza |
| Artículos | Descriptivo, útiles | 450 | 🎁, ✅, 📦, 🔥 | #regalo #productos |

---

## IX. Referencias y Recursos

### Referencias Consultadas
- Real Academia Española (RAE): https://www.rae.es/
- Diccionario de la Lengua Española (DLE)
- Fundéu BBVA: https://www.fundeu.es/
- Nueva gramática de la lengua española (2009/2010)

### Herramientas de Verificación
- https://www.rae.es/ (consulta de dudas)
- https://www.fundeu.es/ (recomendaciones)
- https://www.linguateca.pt/ (concordanciador de corpus)

---

*Documento creado: Abril 2026*
*Actualización: Versión 1.0 - Spanish Style Guide para Social-Pip*
*Aplicación: Todo contenido generado por IA en el ecosistema Social-Pip*
*Revisión: Obligatoria antes de publicar cualquier caption o texto*
*Excepciones: Solo para contenido técnico (código, logs, errores) donde la legibilidad prima sobre el estilo