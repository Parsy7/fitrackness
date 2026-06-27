# 💪 Fitrackness

Aplicación web para seguimiento de entrenamientos en gimnasio con sistema de bloques de entrenamiento.

## Stack
- **Frontend:** React + Tailwind CSS
- **Backend:** PHP (API REST)
- **Base de datos:** SQLite
- **IA:** Claude API (importador de bloques por imagen)

## Estructura del proyecto

```
fitrackness/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── config/
│   └── database/
└── frontend/
    ├── public/
    └── src/
        ├── components/
        ├── pages/
        ├── hooks/
        ├── utils/
        └── assets/
```

## Módulos

- **Biblioteca de ejercicios** — ejercicios con alias, fotos y vídeos de referencia
- **Bloques de entrenamiento** — con fecha de inicio e importador por imagen (IA)
- **Registro de sesiones** — peso, series, reps reales, fotos y notas por ejercicio
- **Estadísticas** — evolución, PRs, volumen y asistencia
- **Perfil de usuario** — datos personales, dolencias y condiciones especiales
- **Panel admin** — gestión completa de ejercicios, bloques y usuarios
