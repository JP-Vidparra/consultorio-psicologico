"""
page_admin.py — Panel Administrador
- Gestión usuarios (crear, editar clave, activar/desactivar)
- Vista de actividad por usuario
- Planes de suscripción
"""
import streamlit as st
from db.models import SessionLocal, Usuario, PlanSuscripcion, Cita, Factura, RolUsuario
from werkzeug.security import generate_password_hash
from utils.auth import ROLE_LABELS

def render():
    st.title("⚙️ Panel de Administración")
    tab1, tab2, tab3 = st.tabs(["👥 Usuarios", "📋 Planes de Suscripción", "📊 Actividad General"])

    with tab1:
        _usuarios()
    with tab2:
        _planes()
    with tab3:
        _actividad()


def _usuarios():
    db = SessionLocal()
    usuarios = db.query(Usuario).order_by(Usuario.rol).all()

    st.subheader("Usuarios del Sistema")
    col_new, _ = st.columns([1, 3])
    with col_new:
        if st.button("➕ Nuevo Usuario", width='stretch'):
            st.session_state["crear_usuario"] = True

    if st.session_state.get("crear_usuario"):
        with st.form("form_nuevo_usuario", clear_on_submit=True):
            st.markdown("**Crear nuevo usuario**")
            c1, c2 = st.columns(2)
            nombre   = c1.text_input("Nombre completo *")
            email    = c2.text_input("Correo electrónico *")
            rol      = c1.selectbox("Rol *", ["psicologo","recepcionista","facturacion","admin"],
                                    format_func=lambda x: ROLE_LABELS.get(x, x))
            password = c2.text_input("Contraseña inicial *", type="password")
            submitted = st.form_submit_button("Crear usuario", type="primary")
            cancel    = st.form_submit_button("Cancelar")

            if submitted:
                if not all([nombre, email, password]):
                    st.error("Todos los campos son obligatorios")
                else:
                    existe = db.query(Usuario).filter(Usuario.email == email.lower()).first()
                    if existe:
                        st.error("Ya existe un usuario con ese correo")
                    else:
                        u = Usuario(nombre=nombre, email=email.lower(),
                                    password_hash=generate_password_hash(password),
                                    rol=RolUsuario(rol))
                        db.add(u)
                        db.commit()
                        st.success(f"✅ Usuario {nombre} creado")
                        st.session_state["crear_usuario"] = False
                        st.rerun()
            if cancel:
                st.session_state["crear_usuario"] = False
                st.rerun()

    st.markdown("---")
    for u in usuarios:
        estado_icon = "🟢" if u.activo else "🔴"
        with st.expander(f"{estado_icon} {u.nombre}  —  {ROLE_LABELS.get(u.rol.value, u.rol.value)}  |  {u.email}"):
            c1, c2, c3 = st.columns(3)

            # Cambiar contraseña
            with c1:
                st.markdown("**🔑 Cambiar contraseña**")
                nueva = st.text_input("Nueva contraseña", type="password", key=f"pw_{u.id}")
                if st.button("Actualizar contraseña", key=f"btn_pw_{u.id}"):
                    if len(nueva) < 6:
                        st.error("Mínimo 6 caracteres")
                    else:
                        u.password_hash = generate_password_hash(nueva)
                        db.commit()
                        st.success("✅ Contraseña actualizada")

            # Cambiar rol
            with c2:
                st.markdown("**🎭 Cambiar Rol**")
                roles = ["admin","psicologo","recepcionista","facturacion"]
                idx = roles.index(u.rol.value) if u.rol.value in roles else 0
                nuevo_rol = st.selectbox("Rol", roles, index=idx,
                                         format_func=lambda x: ROLE_LABELS.get(x, x),
                                         key=f"rol_{u.id}")
                if st.button("Actualizar rol", key=f"btn_rol_{u.id}"):
                    u.rol = RolUsuario(nuevo_rol)
                    db.commit()
                    st.success("✅ Rol actualizado")
                    st.rerun()

            # Estado
            with c3:
                st.markdown("**🔘 Estado de cuenta**")
                st.markdown(f"Estado actual: {'**Activo**' if u.activo else '**Inactivo**'}")
                label = "Desactivar usuario" if u.activo else "Activar usuario"
                if st.button(label, key=f"btn_estado_{u.id}",
                             type="secondary" if u.activo else "primary"):
                    u.activo = not u.activo
                    db.commit()
                    st.rerun()

            # Actividad del usuario
            n_citas = db.query(Cita).filter(Cita.psicologo_id == u.id).count()
            n_fact  = db.query(Factura).filter(Factura.creador_id == u.id).count()
            st.markdown(f"📊 **Actividad:** {n_citas} citas registradas · {n_fact} facturas creadas")

    db.close()


def _planes():
    db = SessionLocal()
    planes = db.query(PlanSuscripcion).order_by(PlanSuscripcion.precio).all()

    st.subheader("Planes de Suscripción")
    if st.button("➕ Nuevo Plan"):
        st.session_state["crear_plan"] = True

    if st.session_state.get("crear_plan"):
        with st.form("form_plan", clear_on_submit=True):
            st.markdown("**Nuevo plan de suscripción**")
            c1, c2 = st.columns(2)
            nombre      = c1.text_input("Nombre del plan *")
            precio      = c2.number_input("Precio (COP) *", min_value=0.0, step=10000.0)
            sesiones    = c1.number_input("Sesiones incluidas *", min_value=1, value=4)
            duracion    = c2.number_input("Duración (días)", min_value=1, value=30)
            descripcion = st.text_area("Descripción")
            s = st.form_submit_button("Crear plan", type="primary")
            c = st.form_submit_button("Cancelar")
            if s:
                plan = PlanSuscripcion(nombre=nombre, precio=precio,
                                       sesiones_incluidas=sesiones, duracion_dias=duracion,
                                       descripcion=descripcion)
                db.add(plan)
                db.commit()
                st.success("✅ Plan creado")
                st.session_state["crear_plan"] = False
                st.rerun()
            if c:
                st.session_state["crear_plan"] = False
                st.rerun()

    st.markdown("---")
    for p in planes:
        estado = "🟢" if p.activo else "🔴"
        with st.expander(f"{estado} **{p.nombre}** — ${p.precio:,.0f} COP — {p.sesiones_incluidas} sesiones / {p.duracion_dias} días"):
            c1, c2 = st.columns([2, 1])
            with c1:
                nuevo_nombre  = st.text_input("Nombre", value=p.nombre, key=f"pn_{p.id}")
                nueva_desc    = st.text_area("Descripción", value=p.descripcion, key=f"pd_{p.id}")
                nuevo_precio  = st.number_input("Precio", value=float(p.precio), step=10000.0, key=f"pp_{p.id}")
                nuevas_ses    = st.number_input("Sesiones", value=p.sesiones_incluidas, key=f"ps_{p.id}")
                if st.button("💾 Guardar cambios", key=f"save_plan_{p.id}"):
                    p.nombre = nuevo_nombre; p.descripcion = nueva_desc
                    p.precio = nuevo_precio; p.sesiones_incluidas = nuevas_ses
                    db.commit()
                    st.success("✅ Plan actualizado")
                    st.rerun()
            with c2:
                st.markdown("**Estado**")
                if st.button("🗑️ Eliminar plan" if p.activo else "✅ Reactivar plan",
                             key=f"del_plan_{p.id}"):
                    p.activo = not p.activo
                    db.commit()
                    st.rerun()

    db.close()


def _actividad():
    import pandas as pd
    db = SessionLocal()
    st.subheader("Resumen de Actividad del Sistema")

    total_usuarios  = db.query(Usuario).filter(Usuario.activo == True).count()
    total_citas     = db.query(Cita).count()
    total_facturas  = db.query(Factura).count()

    c1, c2, c3 = st.columns(3)
    c1.metric("👥 Usuarios activos", total_usuarios)
    c2.metric("📅 Citas totales", total_citas)
    c3.metric("🧾 Facturas emitidas", total_facturas)

    st.markdown("---")
    st.markdown("**Usuarios por rol:**")
    data = []
    for u in db.query(Usuario).filter(Usuario.activo == True).all():
        n_citas = db.query(Cita).filter(Cita.psicologo_id == u.id).count()
        data.append({"Nombre": u.nombre, "Rol": ROLE_LABELS.get(u.rol.value, u.rol.value),
                     "Email": u.email, "Citas": n_citas})
    if data:
        st.dataframe(pd.DataFrame(data), width='stretch', hide_index=True)
    db.close()
