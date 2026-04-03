# GUÍA COMPLETA — GitHub + Actualizaciones para María

---

## PARTE 1 — Subir el proyecto a GitHub (tú, una sola vez)

### Paso 1 · Crear el repositorio en GitHub

1. Ve a → https://github.com/new
2. Configura así:
   - **Repository name:** `consultorio-psicologico`
   - **Description:** Sistema de gestión para consultorio psicológico
   - **Visibility:** ✅ **Private** (los datos del negocio no deben ser públicos)
   - **NO** marques ninguna opción de "Initialize this repository"
3. Clic en **"Create repository"**
4. Copia la URL que aparece, algo como:
   `https://github.com/JP-Vidparra/consultorio-psicologico.git`

---

### Paso 2 · Agregar los archivos nuevos a tu carpeta local

Copia estos archivos a `D:\consultorio-psicologico\`:

| Archivo | Para qué sirve |
|---------|---------------|
| `.gitignore` | Le dice a Git qué NO subir (node_modules, la DB) |
| `ACTUALIZAR_SISTEMA.bat` | María lo ejecuta para recibir tus cambios |
| `INSTALAR_CONSULTORIO.bat` | Reemplaza el anterior — ahora también instala Git |
| `README.md` | Descripción visible en GitHub |

---

### Paso 3 · Abrir PowerShell en tu carpeta

1. Abre el Explorador de archivos y ve a `D:\consultorio-psicologico`
2. Clic en la barra de direcciones, escribe `powershell` y presiona Enter
3. Se abre PowerShell ya en esa carpeta

---

### Paso 4 · Ejecutar estos comandos en orden

```powershell
git init

git add .

git commit -m "version inicial sistema consultorio"

git branch -M main

git remote add origin https://github.com/JP-Vidparra/consultorio-psicologico.git

git push -u origin main
```

> Si GitHub pide usuario y contraseña, usa tu usuario de GitHub.
> Si tienes autenticación en dos pasos, necesitas un **Token**:
> GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token
> Marca el permiso `repo` y copia el token. Úsalo como contraseña.

---

### Paso 5 · Verificar

Ve a `https://github.com/JP-Vidparra/consultorio-psicologico`
Deberías ver todos los archivos del proyecto. ✅

---

## PARTE 2 — Configurar el equipo de María (una sola vez)

> Necesitas acceso físico o remoto al equipo de María para este paso.

### Opción A — María tiene la carpeta de una instalación anterior

Abre CMD en `D:\consultorio-psicologico` (o donde esté la carpeta) y ejecuta:

```cmd
git init
git remote add origin https://github.com/JP-Vidparra/consultorio-psicologico.git
git fetch origin
git reset --hard origin/main
```

Luego copia el acceso directo de `ACTUALIZAR_SISTEMA.bat` al Escritorio.

---

### Opción B — Instalación fresca en el equipo de María

1. Copia la carpeta completa `D:\consultorio-psicologico` a un USB
   *(incluye los archivos nuevos: `.gitignore`, `ACTUALIZAR_SISTEMA.bat`, `README.md`)*
2. Conecta el USB al equipo de María
3. Copia la carpeta a `C:\consultorio-psicologico` (o donde quieras)
4. Clic derecho en `INSTALAR_CONSULTORIO.bat` → **Ejecutar como administrador**
5. Seguir instrucciones — al final quedan 2 iconos en el Escritorio

---

## PARTE 3 — Flujo de trabajo desde ahora

### Cuando tú haces un cambio en el código:

```powershell
cd D:\consultorio-psicologico

git add .

git commit -m "descripción breve del cambio"

git push origin main
```

### Cuando María quiere recibir ese cambio:

> Solo si tiene internet en ese momento.

1. Doble clic en **"Actualizar Consultorio"** del Escritorio
2. Esperar ~2-3 minutos
3. Doble clic en **"Iniciar Consultorio"**
4. Los cambios ya están aplicados ✅

---

## PARTE 4 — Qué pasa si María no tiene internet

- El sistema **sigue funcionando** con normalidad (es local)
- `ACTUALIZAR_SISTEMA.bat` detecta que no hay conexión y lo informa claramente
- Cuando vuelva el internet, puede actualizar en cualquier momento
- Los datos nunca se pierden

---

## PENDIENTE — Cambios por implementar

Estos cambios quedaron de la conversación anterior y se deben subir al repo:

- [ ] **Permisos de administrador para usuarios** — gestión de roles desde la interfaz
- [ ] **Módulo de notas clínicas** — creación, edición y visualización de notas por sesión

Una vez implementados: `git add . && git commit -m "agrego permisos y notas" && git push origin main`
María ejecuta "Actualizar Consultorio" y listo.
