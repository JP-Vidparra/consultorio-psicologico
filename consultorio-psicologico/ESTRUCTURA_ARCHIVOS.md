# 📁 ESTRUCTURA DE ARCHIVOS - DÓNDE VA CADA UNO

## 🗂️ Estructura del Proyecto

```
consultorio/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── usuarios.js ⬅️ REEMPLAZAR
│   │   │   ├── facturas.js ⬅️ NUEVO ARCHIVO
│   │   │   └── ...
│   │   ├── middleware/
│   │   │   ├── auth.js ⬅️ REEMPLAZAR
│   │   │   └── ...
│   │   ├── db/
│   │   │   ├── connection.js
│   │   │   └── setup.js ⬅️ EJECUTAR AQUÍ EL SQL
│   │   └── app.js ⬅️ REGISTRAR FACTURAS
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Facturacion.jsx ⬅️ NUEVO ARCHIVO
    │   │   ├── Usuarios.jsx (tu página actual)
    │   │   └── Settings.jsx ⬅️ OPCIONAL
    │   ├── components/
    │   │   ├── ChangePasswordModal.jsx ⬅️ NUEVO ARCHIVO
    │   │   ├── ChangeMyPasswordModal.jsx ⬅️ NUEVO ARCHIVO
    │   │   └── ...
    │   ├── App.jsx ⬅️ AGREGAR RUTAS
    │   └── ...
    └── package.json
```

---

## 📝 LISTA DE ARCHIVOS - QÚÉDO VA CADA UNO

### BACKEND

| Archivo | Ubicación | Tipo | Acción |
|---------|-----------|------|--------|
| `usuarios.js` | `backend/src/routes/usuarios.js` | REEMPLAZAR | Copiar y reemplazar el archivo actual |
| `auth.js` | `backend/src/middleware/auth.js` | REEMPLAZAR | Copiar y reemplazar el archivo actual |
| `facturas.js` | `backend/src/routes/facturas.js` | NUEVO | Crear nuevo archivo |
| `setup-facturacion.sql` | Ejecutar en BD | SQL | Correr en SQLite (ver paso 7 abajo) |

### FRONTEND

| Archivo | Ubicación | Tipo | Acción |
|---------|-----------|------|--------|
| `Facturacion.jsx` | `frontend/src/pages/Facturacion.jsx` | NUEVO | Crear nueva página |
| `ChangePasswordModal.jsx` | `frontend/src/components/ChangePasswordModal.jsx` | NUEVO | Crear nuevo componente |
| `ChangeMyPasswordModal.jsx` | `frontend/src/components/ChangeMyPasswordModal.jsx` | NUEVO | Crear nuevo componente |

### ARCHIVOS DE EJEMPLO (NO COPIAR DIRECTAMENTE)

Estos son **ejemplos de cómo integrar**, **no archivos finales**:
- `UsuariosPageExample.jsx` - Muestra cómo agregar botón a tu página de Usuarios actual
- `ProfileIntegrationExample.jsx` - Muestra cómo agregar en menú de perfil
- `GUIA_IMPLEMENTACION.md` - Guía con pasos detallados

---

## ⚡ PASOS DE IMPLEMENTACIÓN

### PASO 1: Backend - Actualizar archivos existentes

```bash
# 1. Abre backend/src/routes/usuarios.js
# 2. Reemplaza TODO el contenido con el nuevo usuarios.js

# 3. Abre backend/src/middleware/auth.js
# 4. Reemplaza TODO el contenido con el nuevo auth.js
```

### PASO 2: Backend - Crear archivo de facturas

```bash
# 1. Abre una terminal en la carpeta backend/src/routes/
# 2. Crea un archivo nuevo: facturas.js
# 3. Copia TODO el contenido del archivo facturas.js proporcionado
```

### PASO 3: Backend - Registrar rutas en app.js

En `backend/src/app.js` (o main.js), busca donde registras las rutas y agrega:

```javascript
// Importar
const facturasRouter = require('./routes/facturas');

// Registrar rutas (después de las otras rutas)
app.use('/api/facturas', facturasRouter);
app.use('/api/contabilidad', facturasRouter);
```

Si no tienes estas líneas, agrégalas completas. Si ya existen, no duplicar.

### PASO 4: Base de datos - Crear tablas de facturación

**Opción A: Con node (Recomendado)**

En `backend/src/db/setup.js`, antes de `module.exports`, agrega:

```javascript
// Tablas de facturación
const setupFacturacion = async () => {
  const sqlFacturas = `
    CREATE TABLE IF NOT EXISTS facturas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero_factura TEXT UNIQUE NOT NULL,
      paciente_id INTEGER NOT NULL,
      profesional_id INTEGER,
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
      fecha_pago DATETIME,
      monto_total REAL NOT NULL,
      estado TEXT DEFAULT 'pendiente',
      metodo_pago TEXT,
      referencia_pago TEXT,
      notas TEXT,
      creada_por INTEGER NOT NULL,
      actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
      FOREIGN KEY (profesional_id) REFERENCES usuarios(id),
      FOREIGN KEY (creada_por) REFERENCES usuarios(id)
    );
  `;

  const sqlItems = `
    CREATE TABLE IF NOT EXISTS factura_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      factura_id INTEGER NOT NULL,
      descripcion TEXT NOT NULL,
      cantidad REAL NOT NULL DEFAULT 1,
      precio_unitario REAL NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (factura_id) REFERENCES facturas(id) ON DELETE CASCADE
    );
  `;

  const sqlPagos = `
    CREATE TABLE IF NOT EXISTS pagos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      factura_id INTEGER,
      paciente_id INTEGER NOT NULL,
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
      monto REAL NOT NULL,
      metodo TEXT,
      referencia TEXT,
      registrado_por INTEGER,
      FOREIGN KEY (factura_id) REFERENCES facturas(id),
      FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
      FOREIGN KEY (registrado_por) REFERENCES usuarios(id)
    );
  `;

  await db.exec(sqlFacturas);
  await db.exec(sqlItems);
  await db.exec(sqlPagos);

  console.log('✓ Tablas de facturación creadas');
};

// Llamar esta función en la función principal
setupFacturacion();
```

**Opción B: Con SQLite3 CLI**

```bash
# En terminal, navega a la carpeta donde está tu base de datos
cd backend/src/db

# Ejecuta el script SQL
sqlite3 consultorio.db < ../../../setup-facturacion.sql
```

**Opción C: Con herramienta gráfica**

- Usa DB Browser for SQLite (https://sqlitebrowser.org/)
- Abre tu archivo `consultorio.db`
- Copia el SQL de `setup-facturacion.sql`
- Pega en la pestaña SQL y ejecuta

### PASO 5: Frontend - Crear componentes

```bash
# 1. Crea la carpeta si no existe:
#    frontend/src/components/

# 2. Crea estos archivos:
#    - ChangePasswordModal.jsx
#    - ChangeMyPasswordModal.jsx

# 3. Copia el contenido de los archivos proporcionados
```

### PASO 6: Frontend - Crear página de Facturación

```bash
# 1. Crea la carpeta si no existe:
#    frontend/src/pages/

# 2. Crea el archivo:
#    Facturacion.jsx

# 3. Copia el contenido completo del archivo Facturacion.jsx proporcionado
```

### PASO 7: Frontend - Actualizar App.jsx (o Router)

En `frontend/src/App.jsx`, agrega la ruta a Facturación:

```javascript
import Facturacion from './pages/Facturacion';
import Usuarios from './pages/Usuarios';
// ... otros imports

// En tu Router o definición de rutas:
<Route path="/facturacion" element={<Facturacion />} />
<Route path="/usuarios" element={<Usuarios />} />
```

### PASO 8: Frontend - Integrar modales de contraseña

**En tu página de Usuarios** (`frontend/src/pages/Usuarios.jsx`):

```javascript
import ChangePasswordModal from '../components/ChangePasswordModal';

// En el JSX de la tabla, agregar un botón:
<button
  onClick={() => {
    setSelectedUsuario(usuario);
    setShowChangePasswordModal(true);
  }}
  className="px-3 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 text-xs font-semibold"
>
  Cambiar contraseña
</button>

// Y el modal:
{showChangePasswordModal && selectedUsuario && (
  <ChangePasswordModal
    usuario={selectedUsuario}
    onClose={() => {
      setShowChangePasswordModal(false);
      setSelectedUsuario(null);
    }}
    onSuccess={() => cargarUsuarios()}
  />
)}
```

**En tu menú de usuario/perfil:**

```javascript
import ChangeMyPasswordModal from '../components/ChangeMyPasswordModal';

// En el menú desplegable o página de settings:
<button
  onClick={() => setShowChangePasswordModal(true)}
  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
>
  🔒 Cambiar contraseña
</button>

{showChangePasswordModal && (
  <ChangeMyPasswordModal
    onClose={() => setShowChangePasswordModal(false)}
    onSuccess={() => console.log('Contraseña actualizada')}
  />
)}
```

### PASO 9: Frontend - Agregar botón de Facturación en menú

En tu menú principal o sidebar (App.jsx o Layout.jsx), agrega:

```javascript
<Link to="/facturacion" className="menu-item">
  💰 Facturación
</Link>
```

O un botón en el header:

```javascript
<button
  onClick={() => navigate('/facturacion')}
  className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded"
>
  💰 Facturación
</button>
```

---

## 🔐 PERMISOS FINALES

Después de implementar todo, los permisos quedarán así:

| Módulo | Admin | Psicólogo | Facturación | Recepción |
|--------|-------|-----------|-------------|-----------|
| Usuarios | ✅ | ❌ | ❌ | ❌ |
| Facturación | ✅ | ❌ | ✅ | ❌ |
| Contabilidad | ✅ | ❌ | ✅ | ❌ |
| Pacientes | ✅ | ✅ | ❌ | ✅ |
| Citas | ✅ | ✅ | ❌ | ✅ |
| Cambiar mi contraseña | ✅ | ✅ | ✅ | ✅ |

---

## ✅ CHECKLIST FINAL

Antes de iniciar el sistema:

- [ ] `usuarios.js` reemplazado en `backend/src/routes/`
- [ ] `auth.js` reemplazado en `backend/src/middleware/`
- [ ] `facturas.js` creado en `backend/src/routes/`
- [ ] Rutas de facturación registradas en `app.js`
- [ ] Tablas de BD creadas (ejecutado SQL)
- [ ] `ChangePasswordModal.jsx` en `frontend/src/components/`
- [ ] `ChangeMyPasswordModal.jsx` en `frontend/src/components/`
- [ ] `Facturacion.jsx` creado en `frontend/src/pages/`
- [ ] Ruta de facturación agregada en App.jsx
- [ ] Botón de facturación visible en menú
- [ ] Modales integradas en Usuarios y Perfil

---

## 🧪 PRUEBAS RÁPIDAS

### Test 1: Cambio de contraseña (admin)
```
1. Login como admin
2. Ir a Usuarios
3. Clic en "Cambiar contraseña" para otro usuario
4. Ingresa nueva contraseña
5. Logout y login con la nueva contraseña
```

### Test 2: Cambio de contraseña (personal)
```
1. Login como cualquier usuario
2. Clic en perfil/settings
3. Clic en "Cambiar contraseña"
4. Ingresa contraseña actual + nueva
5. Verifica que se cambió correctamente
```

### Test 3: Facturación (acceso)
```
1. Login como psicólogo
2. Intenta acceder a /facturacion
3. Debe mostrar error de permiso
4. Login como usuario de facturación
5. Accede a /facturacion correctamente
```

### Test 4: Crear factura
```
1. Login como facturación
2. Clic en "+ Nueva Factura"
3. Completa formulario con datos
4. Clic en "Crear Factura"
5. Verifica que aparezca en la lista
```

---

## 🆘 PROBLEMAS COMUNES

**Error: "Cannot find module './routes/facturas'"**
- Verifica que facturas.js está en `backend/src/routes/`
- Verifica la ruta en app.js

**Error: "No tienes permiso para acceder"**
- Verifica que el usuario tiene rol 'facturacion'
- Verifica que estás autenticado

**Las tablas no existen**
- Ejecuta el SQL de setup-facturacion.sql
- Verifica que no hay errores en la ejecución

**Modal no aparece**
- Verifica que importaste el componente
- Verifica que el estado para mostrar es true
- Abre consola para ver errores (F12)

---

## 📞 SOPORTE

Si algo no funciona:
1. Revisa la consola del navegador (F12 → Console)
2. Revisa la terminal del backend
3. Verifica que copiaste el código completo sin cambios
4. Verifica las rutas de archivo en tu proyecto

