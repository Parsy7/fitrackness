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
5. **Reutilización obligatoria.** Antes de crear cualquier componente nuevo (botón, pill, card, input…) hay que comprobar si ya existe uno reutilizable. El objetivo es que no haya dos botones con matices diferentes ni variantes no documentadas.
6. **Un solo lugar por componente.** Cada componente base (`.btn`, `.card`, `.pill`, `.input`…) se define una sola vez en su módulo CSS correspondiente y se importa donde se necesite.

### Proceso para añadir algo nuevo

Si durante el desarrollo se detecta la necesidad de un nuevo valor (un radio diferente, un tamaño de fuente adicional, un color nuevo…):

1. **No añadirlo directamente al código.**
2. Notificarlo a la propietaria del proyecto con justificación.
3. Si se aprueba, se añade primero a esta guía como variable y luego se usa en el código.

> Esto garantiza que la guía esté siempre actualizada y que el sistema sea coherente en todo momento.

---

## Tipografía

Dark theme. Paleta basada en verdes muy oscuros con acento cobre/marrón cálido y texto beige.

| Nombre | Hex | Uso |
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

```css
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
```

---

## Colores

Dark theme. Paleta basada en verdes muy oscuros con acento cobre/marrón cálido y texto beige.

---

## Tipografía

### Fuentes
- **Display:** `Barlow Condensed` — títulos, impacto visual, sensación atlética
- **Body:** `Inter` — textos, botones, etiquetas, máxima legibilidad en móvil

Importar desde Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;700&family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
```

```css
--font-display: "Barlow Condensed", sans-serif; /* títulos grandes */
--font-body:    "Inter", sans-serif;            /* textos, botones, etiquetas */
```

### Escala de tamaños
```css
--text-xs:    12px;   /* detalles muy pequeños, timestamps, metadatos */
--text-sm:    14px;   /* pills, etiquetas, texto secundario */
--text-base:  16px;   /* texto de cuerpo, botones, subtítulos */
--text-md:    18px;   /* pretítulos, highlights, botones grandes */
--text-lg:    22px;   /* títulos de sección */
--text-xl:    25px;   /* títulos de página */
```

### Pesos
```css
--weight-regular: 400;
--weight-medium:  500;
--weight-bold:    700;
```

### Interlineado
```css
--leading-tight:  1.2;   /* títulos */
--leading-normal: 1.5;   /* cuerpo */
```

---

## Espaciado

### Padding general
```css
--padding-page:    20px;  /* padding general de página y secciones */
--padding-card:    15px;  /* padding interior de cards */
--padding-btn-x:   10px;  /* padding izquierda/derecha en botones */
--padding-btn-y:    2px;  /* padding arriba/abajo en botones */
```

### Gaps (solo flex)
```css
--gap-sm:  10px;
--gap-md:  15px;
```

### Separaciones entre elementos de texto
```css
--space-title-subtitle:   5px;   /* entre título grande y subtítulo */
--space-subtitle-body:   25px;   /* entre subtítulo y texto normal */
--space-icon-text:        5px;   /* entre icono y texto (horizontal y vertical) */
```

---

## Border Radius
```css
--radius-card:   16px;   /* cards, paneles, modales */
--radius-sm:     10px;   /* inputs, botones pequeños */
--radius-md:     22px;   /* botones medianos/grandes si se necesita */
--radius-pill:  999px;   /* pills, badges, tags */
```

---

## Bordes
```css
--border-card: 1px solid var(--color-border);  /* borde de cards, sin sombras */
```

> ⚠️ **Sin sombras.** Nunca usar `box-shadow`. Las cards se distinguen únicamente por su borde y fondo.

---

## Layout

> Usar **flex siempre**. No usar grid salvo justificación explícita.

```css
/* Ejemplo de sección estándar */
.section {
  display: flex;
  flex-direction: column;
  gap: var(--gap-md);
  padding: var(--padding-page);
}

/* Fila con icono + texto */
.icon-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--space-icon-text);
}
```

---

## Variables CSS completas (base)

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
  --font-body:     ;

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
  --padding-page:           20px;
  --padding-card:           15px;
  --padding-btn-x:          10px;
  --padding-btn-y:           2px;
  --gap-sm:                 10px;
  --gap-md:                 15px;
  --space-title-subtitle:    5px;
  --space-subtitle-body:    25px;
  --space-icon-text:         5px;

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
  display: flex;
  align-items: center;
  gap: var(--space-icon-text);
  cursor: pointer;
  border: none;
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-text-inverse);
}

.btn-secondary {
  background: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
}
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
```

### Jerarquía de texto
```css
.title-page    { font-size: var(--text-xl); font-weight: var(--weight-bold);    line-height: var(--leading-tight); }
.title-section { font-size: var(--text-lg); font-weight: var(--weight-bold);    line-height: var(--leading-tight); }
.pretitle      { font-size: var(--text-md); font-weight: var(--weight-medium);  margin-bottom: var(--space-title-subtitle); }
.subtitle      { font-size: var(--text-base); font-weight: var(--weight-medium); margin-bottom: var(--space-subtitle-body); }
.body-text     { font-size: var(--text-base); font-weight: var(--weight-regular); line-height: var(--leading-normal); }
.label         { font-size: var(--text-sm);  font-weight: var(--weight-medium); }
.caption       { font-size: var(--text-xs);  font-weight: var(--weight-regular); color: var(--color-text-muted); }
```

---

*Pendiente: colores y tipografías. El resto del sistema está listo para completarse.*
