# CLAUDE.md — Instrucciones del proyecto Fitrackness

## Qué es este proyecto

**Fitrackness** es una aplicación web para seguimiento de entrenamientos en gimnasio. La usuaria entrena en un gym que ofrece bloques de ejercicios (A, B, C, D) que cambian periódicamente. La app permite registrar pesos, series y repeticiones reales por ejercicio, adjuntar fotos y vídeos, y consultar el progreso a lo largo del tiempo.

Hay dos roles: **admin** (gestiona ejercicios, bloques y usuarios) y **usuario** (registra sus sesiones y consulta su progreso).

---

## Stack técnico

- **Frontend:** React + Tailwind CSS + variables CSS propias
- **Backend:** PHP (API REST)
- **Base de datos:** SQLite
- **IA:** Claude API (importador de bloques por imagen, mapeo de ejercicios)
- **Repositorio:** GitHub — se hace commit y push tras cada bloque de trabajo

---

## Módulos del proyecto

1. **Biblioteca de ejercicios** — nombre canónico, alias/variantes, descripción, grupo muscular, equipamiento, adaptaciones, fotos y vídeos de referencia
2. **Bloques de entrenamiento** — nombre, fecha de inicio, ejercicios con parámetros recomendados (series/reps/descanso). El bloque activo es el de fecha de inicio más reciente ≤ hoy
3. **Importador de bloques por imagen** — la IA extrae ejercicios de una foto, los mapea a los existentes por nombre canónico y alias, y presenta una pantalla de revisión (encontrado / posible coincidencia / nuevo)
4. **Registro de sesiones** — por bloque o grupal. Por ejercicio: series, reps y peso reales (pueden diferir del plan), adaptación del día, fotos y vídeos propios, notas
5. **Estadísticas** — evolución de peso por ejercicio, volumen, PRs automáticos, frecuencia
6. **Perfil de usuario** — nombre, email, edad, altura, peso, dolencias/lesiones/condiciones especiales
7. **Panel admin** — gestión de ejercicios, bloques, alias, adaptaciones y vista de todos los usuarios

---

## Estructura de carpetas

```
fitrackness/
├── CLAUDE.md              ← este archivo
├── BRAND_GUIDE.md         ← guía de marca (lectura obligatoria antes de tocar UI)
├── README.md
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── config/
│   └── database/
│       └── schema.sql
└── frontend/
    ├── public/
    └── src/
        ├── components/    ← componentes reutilizables (Button, Card, Pill, Input…)
        ├── pages/
        ├── hooks/
        ├── utils/
        └── assets/
```

---

## Reglas de desarrollo — OBLIGATORIO LEER ANTES DE ESCRIBIR CÓDIGO

### 1. Consultar la guía de marca SIEMPRE
Antes de crear o modificar cualquier componente visual, leer `BRAND_GUIDE.md`. Ninguna decisión de diseño puede saltarse lo que define la guía.

### 2. Sin valores hardcodeados en el CSS
Ningún color, tamaño de fuente, radio, padding, gap o borde puede escribirse como valor literal. Siempre usar la variable CSS correspondiente definida en la guía:
```css
/* ❌ MAL */
border-radius: 16px;
color: #A27B5C;

/* ✅ BIEN */
border-radius: var(--radius-card);
color: var(--color-primary);
```

### 3. Reutilizar componentes, nunca duplicar
Antes de crear un componente nuevo comprobar si ya existe en `frontend/src/components/`. El objetivo es que haya un único `.btn`, una única `.card`, una única `.pill`, etc. Si se necesita una variante, se añade como modificador del componente existente (`.btn--outline`, `.card--highlight`…), nunca como componente nuevo paralelo.

### 4. Sin sombras
Nunca usar `box-shadow` ni `text-shadow`. Las cards se distinguen por su borde (`var(--border-card)`) y su fondo (`var(--color-bg-card)`).

### 5. Mobile first — PRIORITARIO
La app se usa principalmente desde el móvil. Todo el diseño y desarrollo parte de pantalla pequeña y escala hacia arriba si fuera necesario:
- Breakpoint base: 390px (iPhone/Android estándar)
- Los componentes se diseñan para ser cómodos con el pulgar (mínimo 44px de área táctil en botones e interactivos)
- Sin hovers como única indicación de estado — los estados deben ser visibles sin ratón
- Textos legibles sin zoom — mínimo `var(--text-sm)` (14px) para cualquier texto interactivo
- Las media queries van de pequeño a grande: `@media (min-width: 768px) { … }`

### 6. Flex siempre
El layout se construye con flexbox usando `var(--gap-sm)` o `var(--gap-md)`. No usar grid salvo que se apruebe explícitamente.

### 6. Para añadir algo nuevo a la guía
Si durante el desarrollo se detecta la necesidad de un nuevo valor (radio, color, fuente, tamaño…):
1. No añadirlo directamente al código
2. Notificarlo a la propietaria con justificación
3. Si se aprueba, añadirlo primero a `BRAND_GUIDE.md` y luego usarlo en el código

### 7. Commits y push
Hacer commit y push a GitHub tras cada bloque de trabajo completado. Mensajes de commit en inglés con prefijo semántico:
- `feat:` nueva funcionalidad
- `fix:` corrección de error
- `docs:` documentación
- `style:` cambios de diseño/CSS
- `refactor:` reorganización de código sin cambio funcional

---

## Base de datos (SQLite)

Tablas principales: `users`, `exercises`, `exercise_aliases`, `exercise_media`, `blocks`, `block_exercises`, `sessions`, `session_exercises`, `session_exercise_media`, `personal_records`.

Ver schema completo en `backend/database/schema.sql`.

---

## Decisiones de diseño tomadas

- **Dark theme** — fondo `#2C3639`, cards `#3F4E4F`, acento cobre `#A27B5C`, texto beige `#DCD7C9`
- **Fuentes** — Barlow Condensed (display) + Inter (body), ambas de Google Fonts
- **Sin sombras** — bordes `1px solid` muy sutiles en lugar de elevación por sombra
- **Border radius** — 16px cards, 999px pills, 10px y 22px para otros elementos
- **Spacing** — padding de página 20px, cards 15px, botones 2px/10px
- **Gaps** — solo 10px o 15px
