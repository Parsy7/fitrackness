# Fitrackness — Guía de Marca

---

## ⚠️ Reglas de uso — Lectura obligatoria

Esta guía es **la única fuente de verdad** para cualquier decisión de diseño en Fitrackness.

### Mobile first — PRIORITARIO
La app se usa principalmente desde el móvil. Todo parte de pantalla pequeña:
- Breakpoint base: **390px**
- Área táctil mínima en elementos interactivos: **44px**
- Sin hover como único indicador de estado
- Media queries siempre de pequeño a grande: `@media (min-width: 768px)`
- Ningún texto interactivo por debajo de `var(--text-sm)` (14px)

### Normas estrictas

1. **Ninguna pantalla, componente o modificación puede saltarse esta guía.** Toda nueva página o componente debe derivar sus valores de las variables aquí definidas, sin excepción.
2. **Prohibido hardcodear valores.** Ningún color, tamaño de fuente, radio, padding, gap o borde puede escribirse como valor literal en el código. Siempre se usa la variable CSS correspondiente.
3. **Sin sombras.** Nunca usar `box-shadow` ni `text-shadow` en ningún componente.
4. **Siempre flex.** El layout se construye con flexbox. No usar grid salvo justificación explícita y aprobada.
5. **Reutilización obligatoria.** Antes de crear cualquier componente nuevo hay que comprobar si ya existe uno reutilizable.
6. **Un solo lugar por componente.** Cada componente base se define una sola vez y se importa donde se necesite.

### Proceso para añadir algo nuevo

Si durante el desarrollo se detecta la necesidad de un nuevo valor (radio, color, fuente, tamaño…):
1. No añadirlo directamente al código.
2. Notificarlo a la propietaria con justificación.
3. Si se aprueba, añadirlo primero aquí y luego usarlo en el código.

---

## Colores

Dark theme. Paleta basada en verdes muy oscuros con acento cobre/marrón cálido y texto beige.

| Variable | Hex | Uso |
|---|---|---|
| `--color-bg` | `#2C3639` | Fondo base de la app |
| `--color-bg-card` | `#3F4E4F` | Fondo de cards y superficies elevadas |
| `--color-bg-elevated` | `#4A5C5D` | Hover de cards, modales, elementos sobre card |
| `--color-primary` | `#A27B5C` | Acento principal, botones primarios, highlights |
| `--color-primary-dark` | `#8A6548` | Hover/pressed del primario |
| `--color-primary-light` | `#B8956E` | Estados activos sutiles, pills de acento |
| `--color-border` | `#4A5C5D` | Bordes de cards (1px solid, muy sutil) |
| `--color-border-strong` | `#5C7070` | Bordes de inputs, separadores visibles |
| `--color-text` | `#DCD7C9` | Texto principal |
| `--color-text-muted` | `#9BA8A8` | Texto secundario, captions, placeholders |
| `--color-text-inverse` | `#2C3639` | Texto sobre fondo claro (botones primarios) |
| `--color-success` | `#5A8A6A` | Éxito, PR nuevo, confirmaciones |
| `--color-warning` | `#C4954A` | Avisos, adaptaciones |
| `--color-error` | `#A25252` | Errores, eliminaciones |

---

## Tipografía

### Fuentes
- **Display:** `Barlow Condensed` — títulos, impacto visual, sensación atlética
- **Body:** `Inter` — textos, botones, etiquetas, máxima legibilidad en móvil

```html
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;700&family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
```

### Escala de tamaños
| Variable | Valor | Uso |
|---|---|---|
| `--text-xs` | `12px` | Timestamps, metadatos |
| `--text-sm` | `14px` | Pills, etiquetas, texto secundario |
| `--text-base` | `16px` | Cuerpo, botones, subtítulos |
| `--text-md` | `18px` | Pretítulos, highlights |
| `--text-lg` | `22px` | Títulos de sección |
| `--text-xl` | `25px` | Títulos de página |

### Pesos
| Variable | Valor |
|---|---|
| `--weight-regular` | `400` |
| `--weight-medium` | `500` |
| `--weight-bold` | `700` |

---

## Espaciado

| Variable | Valor | Uso |
|---|---|---|
| `--padding-page` | `20px` | Padding general de página |
| `--padding-card` | `15px` | Padding interior de cards |
| `--padding-btn-x` | `10px` | Padding horizontal botones |
| `--padding-btn-y` | `2px` | Padding vertical botones |
| `--gap-sm` | `10px` | Gap pequeño entre elementos flex |
| `--gap-md` | `15px` | Gap medio entre elementos flex |
| `--space-title-subtitle` | `5px` | Entre título y subtítulo |
| `--space-subtitle-body` | `25px` | Entre subtítulo y cuerpo |
| `--space-icon-text` | `5px` | Entre icono y texto |

---

## Border Radius

| Variable | Valor | Uso |
|---|---|---|
| `--radius-card` | `16px` | Cards, paneles, modales |
| `--radius-sm` | `10px` | Inputs, botones pequeños |
| `--radius-md` | `22px` | Botones medianos/grandes |
| `--radius-pill` | `999px` | Pills, badges, tags |

---

## Bordes

```css
--border-card: 1px solid var(--color-border);
```

> ⚠️ **Sin sombras nunca.** Las cards se distinguen por su borde y fondo, nunca por sombra.

---

## Variables CSS completas `:root`

```css
:root {
  /* Colores */
  --color-bg:             #2C3639;
  --color-bg-card:        #3F4E4F;
  --color-bg-elevated:    #4A5C5D;
  --color-primary:        #A27B5C;
  --color-primary-dark:   #8A6548;
  --color-primary-light:  #B8956E;
  --color-border:         #4A5C5D;
  --color-border-strong:  #5C7070;
  --color-text:           #DCD7C9;
  --color-text-muted:     #9BA8A8;
  --color-text-inverse:   #2C3639;
  --color-success:        #5A8A6A;
  --color-warning:        #C4954A;
  --color-error:          #A25252;

  /* Tipografía */
  --font-display: "Barlow Condensed", sans-serif;
  --font-body:    "Inter", sans-serif;

  /* Escala tipográfica */
  --text-xs:    12px;
  --text-sm:    14px;
  --text-base:  16px;
  --text-md:    18px;
  --text-lg:    22px;
  --text-xl:    25px;

  /* Pesos */
  --weight-regular: 400;
  --weight-medium:  500;
  --weight-bold:    700;

  /* Interlineado */
  --leading-tight:  1.2;
  --leading-normal: 1.5;

  /* Espaciado */
  --padding-page:          20px;
  --padding-card:          15px;
  --padding-btn-x:         10px;
  --padding-btn-y:          2px;
  --gap-sm:                10px;
  --gap-md:                15px;
  --space-title-subtitle:   5px;
  --space-subtitle-body:   25px;
  --space-icon-text:        5px;

  /* Radios */
  --radius-card:   16px;
  --radius-sm:     10px;
  --radius-md:     22px;
  --radius-pill:  999px;

  /* Bordes */
  --border-card: 1px solid var(--color-border);
}
```

---

## Componentes base

### Card
```css
.card {
  border: var(--border-card);
  border-radius: var(--radius-card);
  padding: var(--padding-card);
  background: var(--color-bg-card);
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
}
```

### Botón
```css
.btn {
  padding: var(--padding-btn-y) var(--padding-btn-x);
  border-radius: var(--radius-sm);
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  font-family: var(--font-body);
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-icon-text);
  cursor: pointer;
  border: none;
}
.btn-primary  { background: var(--color-primary); color: var(--color-text-inverse); }
.btn-secondary { background: transparent; color: var(--color-primary); border: 1px solid var(--color-primary); }
.btn-danger   { background: var(--color-error); color: var(--color-text); }
.btn-ghost    { background: transparent; color: var(--color-text-muted); }
```

### Pill / Badge
```css
.pill {
  border-radius: var(--radius-pill);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  padding: 2px 10px;
  display: inline-flex;
  align-items: center;
  gap: var(--space-icon-text);
}
.pill-primary { background: var(--color-primary); color: var(--color-text-inverse); }
.pill-success { background: var(--color-success); color: var(--color-text); }
.pill-warning { background: var(--color-warning); color: var(--color-text-inverse); }
.pill-muted   { background: var(--color-bg-elevated); color: var(--color-text-muted); }
```

### Input
```css
.input {
  background: var(--color-bg);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: var(--text-base);
  padding: 10px var(--padding-card);
  min-height: 44px;
  width: 100%;
}
.input::placeholder { color: var(--color-text-muted); }
.input:focus { outline: none; border-color: var(--color-primary); }
```

### Jerarquía de texto
```css
.title-page    { font-family: var(--font-display); font-size: var(--text-xl);   font-weight: var(--weight-bold);    line-height: var(--leading-tight); }
.title-section { font-family: var(--font-display); font-size: var(--text-lg);   font-weight: var(--weight-bold);    line-height: var(--leading-tight); }
.pretitle      { font-family: var(--font-body);    font-size: var(--text-md);   font-weight: var(--weight-medium);  margin-bottom: var(--space-title-subtitle); }
.subtitle      { font-family: var(--font-body);    font-size: var(--text-base); font-weight: var(--weight-medium);  margin-bottom: var(--space-subtitle-body); }
.body-text     { font-family: var(--font-body);    font-size: var(--text-base); font-weight: var(--weight-regular); line-height: var(--leading-normal); }
.label         { font-family: var(--font-body);    font-size: var(--text-sm);   font-weight: var(--weight-medium); }
.caption       { font-family: var(--font-body);    font-size: var(--text-xs);   font-weight: var(--weight-regular); color: var(--color-text-muted); }
```
