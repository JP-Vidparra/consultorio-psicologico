# Sistema de Gestión — Consultorio Psicológico

Sistema local de gestión para consultorio psicológico. Maneja pacientes, sesiones, citas, notas clínicas y facturación. Funciona sin internet una vez instalado.

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TailwindCSS |
| Backend | Node.js + Express |
| Base de datos | SQLite (local, sin servidor) |
| Auth | JWT + bcrypt |
| Generación de docs | jsPDF |

---

## Instalación (primer uso en un equipo)

> Requiere internet solo la primera vez para descargar dependencias.

1. Descargar o clonar este repositorio en el equipo
2. Clic derecho en `INSTALAR_CONSULTORIO.bat` → **Ejecutar como administrador**
3. Seguir las instrucciones en pantalla (~5-10 min)
4. Al terminar, aparecen dos iconos en el Escritorio

---

## Uso diario

- Doble clic en **"Iniciar Consultorio"** del Escritorio
- El sistema abre en el navegador en `http://localhost:3000`
- ⚠️ No cerrar la ventana negra mientras se trabaja

---

## Recibir actualizaciones

1. Doble clic en **"Actualizar Consultorio"** del Escritorio
2. Esperar que termine (~2-3 min con internet)
3. Iniciar el sistema normalmente

> 🔒 La base de datos local **no se modifica** al actualizar. Los datos están seguros.

---

## Credenciales por defecto

```
Correo:     admin@consultorio.com
Contraseña: Consultorio2024!
```

> Cambiar la contraseña después del primer acceso.

---

## Estructura del proyecto

```
consultorio-psicologico/
├── backend/                   # API Node.js + Express
│   └── src/
│       ├── db/                # Esquema SQLite y setup inicial
│       ├── routes/            # Endpoints de la API
│       └── middleware/        # Auth JWT
├── frontend/                  # Interfaz React
│   └── src/
│       ├── components/        # Componentes reutilizables
│       ├── pages/             # Vistas del sistema
│       └── context/           # Estado global
├── docs/                      # Documentación del proyecto
├── INSTALAR_CONSULTORIO.bat   # Instalación inicial
├── INICIAR_SISTEMA.bat        # Arranque diario
├── ACTUALIZAR_SISTEMA.bat     # Recibir actualizaciones
└── README.md
```

---

## Roles de usuario

| Rol | Acceso |
|-----|--------|
| Admin | Todo el sistema + gestión de usuarios |
| Psicóloga | Pacientes, sesiones, notas clínicas |
| Administrativo | Citas, facturación |

---

## Flujo de trabajo (para el desarrollador)

```bash
# 1. Hacer cambios en el código
# 2. Subir a GitHub
git add .
git commit -m "descripción del cambio"
git push origin main

# 3. María ejecuta "Actualizar Consultorio" desde su Escritorio
```

---

## Decisiones de arquitectura

- **Local vs. nube:** Se eligió arquitectura local para garantizar funcionamiento offline. El consultorio opera con internet intermitente.
- **SQLite:** Sin servidor de base de datos. La DB vive como archivo en el mismo equipo.
- **Scripts .bat:** Toda interacción del usuario final es mediante doble clic, sin uso de terminal.
