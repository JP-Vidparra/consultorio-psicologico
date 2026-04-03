# GUÍA DE IMPLEMENTACIÓN: Gestión de Contraseñas y Facturación

## 📋 Resumen de cambios

Este documento describe cómo implementar:
1. ✅ Cambio de contraseña para usuarios (por admin)
2. ✅ Cambio de contraseña personal (cada usuario)
3. ✅ Permisos para usuario de facturación
4. ✅ Endpoints de facturación con autorización

---

## 1️⃣ BACKEND - Actualizar archivo de usuarios

### Archivo: `backend/src/routes/usuarios.js`

**Cambios necesarios:**
- Reemplazar el archivo actual con `usuarios.js` proporcionado
- Agrega dos nuevos endpoints:
  - `PATCH /usuarios/:id/password` - Admin cambia contraseña de otro usuario
  - `POST /usuarios/me/change-password` - Usuario cambia su propia contraseña

**Ejemplo de uso:**

```bash
# Admin cambia contraseña de usuario ID 2
PATCH /api/usuarios/2/password
Authorization: Bearer {token_admin}
Content-Type: application/json

{
  "password": "NuevaContraseña123!"
}

# Usuario cambia su propia contraseña
POST /api/usuarios/me/change-password
Authorization: Bearer {token_usuario}
Content-Type: application/json

{
  "password_actual": "ContraseñaVieja123",
  "password_nueva": "ContraseñaNueva456"
}
```

---

## 2️⃣ BACKEND - Actualizar middleware de autenticación

### Archivo: `backend/src/middleware/auth.js`

**Cambios necesarios:**
- Reemplazar el archivo actual con `auth.js` proporcionado
- Agrega nuevos middlewares:
  - `requireFacturacion` - Requiere rol admin o facturacion
  - `requireClinica` - Requiere rol admin o psicologo

**Características nuevas:**
```javascript
// Middleware para facturación
const requireFacturacion = (req, res, next) => {
  if (req.user.rol === 'admin' || req.user.rol === 'facturacion') {
    return next();
  }
  res.status(403).json({ error: 'Acceso denegado' });
};

// Usar en un endpoint
router.get('/facturas', requireFacturacion, async (req, res) => {
  // Solo admin y facturacion pueden acceder
});
```

---

## 3️⃣ BACKEND - Crear router de facturación

### Archivo: `backend/src/routes/facturas.js`

**Cambios necesarios:**
- Crear el archivo nuevo `facturas.js` proporcionado
- Registrarlo en `app.js`:

```javascript
// En backend/src/app.js o main.js
const facturasRouter = require('./routes/facturas');
app.use('/api/facturas', facturasRouter);
app.use('/api/contabilidad', facturasRouter);
```

**Endpoints disponibles:**
- `GET /api/facturas` - Listar facturas
- `POST /api/facturas` - Crear factura
- `GET /api/facturas/:id` - Detalle de factura
- `PATCH /api/facturas/:id/pagar` - Marcar como pagada
- `GET /api/contabilidad/ingresos` - Reporte de ingresos
- `GET /api/contabilidad/por-profesional` - Facturación por profesional
- `GET /api/contabilidad/cuentas-por-cobrar` - Cuentas pendientes

---

## 4️⃣ FRONTEND - Integrar modal de cambio de contraseña (Admin)

### Archivo: `frontend/src/components/ChangePasswordModal.jsx`

**Cambios necesarios:**
1. Crear el archivo `ChangePasswordModal.jsx` proporcionado
2. Importar en la página de Usuarios:

```javascript
import ChangePasswordModal from '../components/ChangePasswordModal';

// En el JSX de la tabla de usuarios:
<button
  onClick={() => {
    setSelectedUsuario(usuario);
    setShowChangePasswordModal(true);
  }}
  className="px-3 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
>
  Cambiar contraseña
</button>

{showChangePasswordModal && selectedUsuario && (
  <ChangePasswordModal
    usuario={selectedUsuario}
    onClose={() => {
      setShowChangePasswordModal(false);
      setSelectedUsuario(null);
    }}
    onSuccess={() => {
      // Recargar lista de usuarios
      cargarUsuarios();
    }}
  />
)}
```

**Lo que permite:**
- Admin puede cambiar la contraseña de cualquier usuario
- Interfaz segura con confirmación
- Validación de mínimo 8 caracteres

---

## 5️⃣ FRONTEND - Integrar modal de cambio de contraseña (Personal)

### Archivo: `frontend/src/components/ChangeMyPasswordModal.jsx`

**Cambios necesarios:**
1. Crear el archivo `ChangeMyPasswordModal.jsx` proporcionado
2. Opción A: Integrar en menú de perfil

```javascript
import ChangeMyPasswordModal from '../components/ChangeMyPasswordModal';

const Header = () => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  return (
    <>
      {/* Tu header actual */}
      
      {/* Menú de usuario */}
      <button onClick={() => setShowPasswordModal(true)}>
        🔒 Cambiar contraseña
      </button>

      {showPasswordModal && (
        <ChangeMyPasswordModal
          onClose={() => setShowPasswordModal(false)}
          onSuccess={() => console.log('Contraseña actualizada')}
        />
      )}
    </>
  );
};
```

3. Opción B: Crear página de configuración

```javascript
// frontend/src/pages/Settings.jsx
import ChangeMyPasswordModal from '../components/ChangeMyPasswordModal';

const Settings = () => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  return (
    <div className="max-w-md">
      <h1>⚙️ Configuración</h1>
      <button
        onClick={() => setShowPasswordModal(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Cambiar contraseña
      </button>

      {showPasswordModal && (
        <ChangeMyPasswordModal
          onClose={() => setShowPasswordModal(false)}
          onSuccess={() => setShowPasswordModal(false)}
        />
      )}
    </div>
  );
};
```

**Lo que permite:**
- Cada usuario puede cambiar su propia contraseña
- Requiere contraseña actual (seguridad)
- Validación de campos

---

## 6️⃣ FRONTEND - Crear módulo de facturación

**Archivo:** `frontend/src/pages/Facturacion.jsx`

```javascript
import React, { useState, useEffect } from 'react';

const Facturacion = () => {
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(false);

  const cargarFacturas = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/facturas', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Sin permiso');
      const data = await response.json();
      setFacturas(data);
    } catch (error) {
      console.error('Error:', error);
      alert('Solo administrador y usuario de facturación pueden acceder');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarFacturas();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">💰 Facturación</h1>
      
      {loading ? (
        <div>Cargando...</div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left">Factura</th>
                <th className="px-6 py-3 text-left">Paciente</th>
                <th className="px-6 py-3 text-left">Monto</th>
                <th className="px-6 py-3 text-left">Estado</th>
              </tr>
            </thead>
            <tbody>
              {facturas.map(f => (
                <tr key={f.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{f.numero_factura}</td>
                  <td className="px-6 py-4">{f.paciente}</td>
                  <td className="px-6 py-4">${f.monto_total}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      f.estado === 'pagada' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {f.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Facturacion;
```

---

## 7️⃣ ACTUALIZAR BASE DE DATOS

Si es la primera vez implementando facturación, necesitas crear estas tablas:

```sql
-- Tabla de facturas
CREATE TABLE IF NOT EXISTS facturas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  numero_factura TEXT UNIQUE,
  paciente_id INTEGER,
  profesional_id INTEGER,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_pago DATETIME,
  monto_total REAL,
  estado TEXT DEFAULT 'pendiente', -- 'pendiente', 'pagada', 'cancelada'
  metodo_pago TEXT,
  referencia_pago TEXT,
  notas TEXT,
  creada_por INTEGER,
  actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
  FOREIGN KEY (profesional_id) REFERENCES usuarios(id),
  FOREIGN KEY (creada_por) REFERENCES usuarios(id)
);

-- Tabla de items de factura
CREATE TABLE IF NOT EXISTS factura_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  factura_id INTEGER,
  descripcion TEXT,
  cantidad REAL,
  precio_unitario REAL,
  subtotal REAL,
  FOREIGN KEY (factura_id) REFERENCES facturas(id)
);

-- Tabla de pagos
CREATE TABLE IF NOT EXISTS pagos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  factura_id INTEGER,
  paciente_id INTEGER,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  monto REAL,
  metodo TEXT,
  referencia TEXT,
  FOREIGN KEY (factura_id) REFERENCES facturas(id),
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id)
);
```

---

## 8️⃣ CAMBIOS EN APP.JS (Backend principal)

```javascript
// En backend/src/app.js o main.js, agregar:

// Rutas de facturación
const facturasRouter = require('./routes/facturas');
app.use('/api/facturas', facturasRouter);

// Nota: El router de facturación también maneja /api/contabilidad
```

---

## 🔐 PERMISOS FINALES

| Acción | Admin | Psicólogo | Facturación | Recepción |
|--------|-------|-----------|-------------|-----------|
| Ver usuarios | ✅ | ❌ | ❌ | ❌ |
| Cambiar contraseña de otros | ✅ | ❌ | ❌ | ❌ |
| Cambiar mi contraseña | ✅ | ✅ | ✅ | ✅ |
| Ver facturas | ✅ | ❌ | ✅ | ❌ |
| Crear facturas | ✅ | ❌ | ✅ | ❌ |
| Ver contabilidad | ✅ | ❌ | ✅ | ❌ |
| Ver pacientes | ✅ | ✅ | ❌ | ✅ |
| Ver citas | ✅ | ✅ | ❌ | ✅ |

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] Actualizar `usuarios.js` en backend
- [ ] Actualizar `auth.js` en backend
- [ ] Crear `facturas.js` en backend
- [ ] Registrar facturas en app.js
- [ ] Crear tablas de facturación en base de datos
- [ ] Crear `ChangePasswordModal.jsx` en frontend
- [ ] Crear `ChangeMyPasswordModal.jsx` en frontend
- [ ] Integrar modal de admin en página de usuarios
- [ ] Integrar modal personal en menú/settings
- [ ] Crear página de facturación
- [ ] Agregar menú de facturación solo para admin y facturacion
- [ ] Probar con diferentes roles

---

## 🧪 PRUEBAS

### Test 1: Admin cambia contraseña de usuario
1. Login como admin
2. Ir a Usuarios
3. Clic en "Cambiar contraseña" para un usuario
4. Ingresar nueva contraseña
5. Verificar que el usuario pueda login con la nueva contraseña

### Test 2: Usuario cambia su propia contraseña
1. Login como cualquier usuario
2. Ir a Configuración o menú de perfil
3. Clic en "Cambiar contraseña"
4. Ingresar contraseña actual + nueva
5. Verificar que el login funcione con la nueva contraseña

### Test 3: Solo facturación puede ver facturas
1. Login como psicólogo → Intenta acceder a /api/facturas → Debe fallar
2. Login como recepción → Intenta acceder a /api/facturas → Debe fallar
3. Login como facturación → Accede a /api/facturas → Debe funcionar
4. Login como admin → Accede a /api/facturas → Debe funcionar

---

## 🆘 TROUBLESHOOTING

**Error: "Contraseña actual incorrecta"**
- Usuario ingresó mal su contraseña actual
- Verificar que no hay espacios al inicio/final

**Error: "Token inválido"**
- El token JWT expiró
- Usuario debe hacer login de nuevo

**Error: "No tienes permiso para acceder"**
- El usuario no tiene el rol correcto
- Verificar que el usuario está asignado al rol 'facturacion' si necesita acceso

**Las contraseñas no se guardan**
- Verificar que bcryptjs está instalado: `npm install bcryptjs`
- Verificar que el endpoint PATCH está registrado correctamente

