# Fitrackness — Guía de Marca

---

## Colores
*Pendiente de definir*

```css
--color-primary:        ;
--color-primary-dark:   ;
--color-secondary:      ;
--color-accent:         ;
--color-bg:             ;
--color-bg-card:        ;
--color-border:         ;
--color-text:           ;
--color-text-muted:     ;
--color-text-inverse:   ;
--color-success:        ;
--color-warning:        ;
--color-error:          ;
```

---

## Tipografía

### Fuentes
*Pendiente de definir*

```css
--font-display:  ; /* títulos grandes */
--font-body:     ; /* textos, botones, etiquetas */
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
  /* Colores — pendiente */
  --color-primary:        ;
  --color-primary-dark:   ;
  --color-secondary:      ;
  --color-accent:         ;
  --color-bg:             ;
  --color-bg-card:        ;
  --color-border:         ;
  --color-text:           ;
  --color-text-muted:     ;
  --color-text-inverse:   ;
  --color-success:        ;
  --color-warning:        ;
  --color-error:          ;

  /* Tipografía — pendiente */
  --font-display:  ;
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
