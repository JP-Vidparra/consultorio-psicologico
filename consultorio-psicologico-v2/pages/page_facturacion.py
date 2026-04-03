"""
page_facturacion.py — Módulo de Facturación
- Crear/emitir facturas con plantilla
- Suscribir pacientes a planes
- Reportes semanales y mensuales
"""
import streamlit as st
import pandas as pd
from datetime import date, datetime, timedelta
from db.models import (SessionLocal, Paciente, Factura, ItemFactura,
                       Suscripcion, PlanSuscripcion, Usuario, EstadoFactura, MetodoPago)
from utils.auth import get_current_user
import io

def render():
    st.title("💰 Módulo de Facturación")
    tab1, tab2, tab3, tab4 = st.tabs(
        ["🧾 Facturas", "➕ Nueva Factura", "📋 Suscripciones", "📊 Reportes"])
    with tab1: _facturas()
    with tab2: _nueva_factura()
    with tab3: _suscripciones()
    with tab4: _reportes()


def _facturas():
    db = SessionLocal()
    st.subheader("Listado de Facturas")

    col1, col2, col3 = st.columns(3)
    estado_fil = col1.selectbox("Estado", ["Todos","borrador","emitida","pagada","anulada"])
    fecha_ini  = col2.date_input("Desde", value=date.today().replace(day=1))
    fecha_fin  = col3.date_input("Hasta", value=date.today())

    q = db.query(Factura)
    if estado_fil != "Todos":
        q = q.filter(Factura.estado == EstadoFactura(estado_fil))
    q = q.filter(Factura.fecha >= str(fecha_ini), Factura.fecha <= str(fecha_fin))
    facturas = q.order_by(Factura.fecha.desc()).all()

    if not facturas:
        st.info("No hay facturas en el período seleccionado")
        db.close(); return

    total_periodo = sum(f.total for f in facturas if f.estado.value in ["emitida","pagada"])
    st.metric("💵 Total período", f"${total_periodo:,.0f} COP")
    st.markdown("---")

    for f in facturas:
        pac = db.query(Paciente).filter(Paciente.id == f.paciente_id).first()
        colores = {"borrador":"⬜","emitida":"🟡","pagada":"🟢","anulada":"🔴"}
        with st.expander(f"{colores.get(f.estado.value,'⬜')} **{f.numero}** — {pac.nombre if pac else '?'} {pac.apellido if pac else ''} — ${f.total:,.0f} — {f.fecha}"):
            items = db.query(ItemFactura).filter(ItemFactura.factura_id == f.id).all()

            # Mostrar detalle
            col1, col2 = st.columns([3, 1])
            with col1:
                if items:
                    df_items = pd.DataFrame([{
                        "Descripción": i.descripcion,
                        "Cant.": i.cantidad,
                        "Precio Unit.": f"${i.precio_unitario:,.0f}",
                        "Subtotal": f"${i.subtotal:,.0f}"
                    } for i in items])
                    st.dataframe(df_items, width='stretch', hide_index=True)
                st.markdown(f"**Descuento:** ${f.descuento:,.0f} | **Total: ${f.total:,.0f} COP**")
                if f.notas:
                    st.markdown(f"*{f.notas}*")

            with col2:
                st.markdown("**Acciones:**")
                if f.estado.value == "borrador":
                    if st.button("📤 Emitir", key=f"emit_{f.id}"):
                        f.estado = EstadoFactura.emitida; db.commit(); st.rerun()
                if f.estado.value == "emitida":
                    metodo = st.selectbox("Método pago", ["efectivo","transferencia","tarjeta","otro"],
                                           key=f"mp_{f.id}")
                    if st.button("✅ Marcar Pagada", key=f"pag_{f.id}"):
                        f.estado = EstadoFactura.pagada
                        f.metodo_pago = MetodoPago(metodo)
                        db.commit(); st.rerun()
                if f.estado.value not in ["anulada"]:
                    if st.button("❌ Anular", key=f"anul_{f.id}"):
                        f.estado = EstadoFactura.anulada; db.commit(); st.rerun()
    db.close()


def _nueva_factura():
    user = get_current_user()
    db   = SessionLocal()

    st.subheader("Crear Nueva Factura")
    pacientes = db.query(Paciente).filter(Paciente.activo == True).order_by(Paciente.apellido).all()
    if not pacientes:
        st.info("No hay pacientes registrados"); db.close(); return

    pac_opts = {f"{p.nombre} {p.apellido} — {p.documento}": p.id for p in pacientes}

    with st.form("form_factura", clear_on_submit=False):
        st.markdown("**Datos generales:**")
        c1, c2 = st.columns(2)
        pac_sel = c1.selectbox("Paciente *", list(pac_opts.keys()))
        pac_id  = pac_opts[pac_sel]
        fecha   = c2.date_input("Fecha factura", value=date.today())
        notas   = st.text_area("Notas / observaciones")

        st.markdown("---")
        st.markdown("**Ítems de la factura:**")
        st.info("Agrega hasta 5 ítems. Deja en blanco los que no uses.")

        items_data = []
        for i in range(5):
            c1, c2, c3 = st.columns([3, 1, 1])
            desc   = c1.text_input(f"Ítem {i+1}", placeholder="Ej: Sesión psicoterapia 60min",
                                   key=f"desc_{i}")
            cant   = c2.number_input("Cant.", min_value=1, value=1, key=f"cant_{i}")
            precio = c3.number_input("Precio", min_value=0.0, step=10000.0, key=f"precio_{i}")
            if desc.strip():
                items_data.append({"desc": desc, "cant": cant, "precio": precio})

        descuento = st.number_input("Descuento (COP)", min_value=0.0, step=5000.0)
        s = st.form_submit_button("🧾 Crear Factura", type="primary")

        if s:
            if not items_data:
                st.error("Agrega al menos un ítem")
            else:
                subtotal = sum(it["cant"] * it["precio"] for it in items_data)
                total    = max(0, subtotal - descuento)
                # Número de factura
                ultimo = db.query(Factura).order_by(Factura.id.desc()).first()
                num_id = (ultimo.id + 1) if ultimo else 1
                numero = f"FACT-{date.today().year}-{num_id:04d}"

                factura = Factura(numero=numero, paciente_id=pac_id, creador_id=user["id"],
                                  fecha=str(fecha), subtotal=subtotal, descuento=descuento,
                                  total=total, notas=notas)
                db.add(factura); db.flush()

                for it in items_data:
                    item = ItemFactura(factura_id=factura.id, descripcion=it["desc"],
                                       cantidad=it["cant"], precio_unitario=it["precio"],
                                       subtotal=it["cant"] * it["precio"])
                    db.add(item)
                db.commit()
                st.success(f"✅ Factura **{numero}** creada — Total: ${total:,.0f} COP")
    db.close()


def _suscripciones():
    db = SessionLocal()
    st.subheader("Suscripciones de Pacientes")

    if st.button("➕ Nueva Suscripción"):
        st.session_state["nueva_sub"] = True

    if st.session_state.get("nueva_sub"):
        pacientes = db.query(Paciente).filter(Paciente.activo == True).all()
        planes    = db.query(PlanSuscripcion).filter(PlanSuscripcion.activo == True).all()
        with st.form("form_sub", clear_on_submit=True):
            c1, c2 = st.columns(2)
            pac_sel  = c1.selectbox("Paciente", [f"{p.nombre} {p.apellido}" for p in pacientes])
            plan_sel = c2.selectbox("Plan", [f"{p.nombre} — ${p.precio:,.0f}" for p in planes])
            fecha_ini = c1.date_input("Fecha inicio", value=date.today())
            pac_id   = pacientes[[f"{p.nombre} {p.apellido}" for p in pacientes].index(pac_sel)].id
            plan_obj = planes[[f"{p.nombre} — ${p.precio:,.0f}" for p in planes].index(plan_sel)]
            fecha_fin = fecha_ini + timedelta(days=plan_obj.duracion_dias)
            c2.markdown(f"**Vence:** {fecha_fin}")

            s = st.form_submit_button("Crear suscripción", type="primary")
            c = st.form_submit_button("Cancelar")
            if s:
                sub = Suscripcion(paciente_id=pac_id, plan_id=plan_obj.id,
                                  fecha_inicio=str(fecha_ini), fecha_fin=str(fecha_fin))
                db.add(sub); db.commit()
                st.success("✅ Suscripción creada")
                st.session_state["nueva_sub"] = False; st.rerun()
            if c:
                st.session_state["nueva_sub"] = False; st.rerun()

    st.markdown("---")
    hoy  = str(date.today())
    subs = db.query(Suscripcion).filter(Suscripcion.activo == True).order_by(Suscripcion.fecha_fin).all()
    for s in subs:
        pac  = db.query(Paciente).filter(Paciente.id == s.paciente_id).first()
        plan = db.query(PlanSuscripcion).filter(PlanSuscripcion.id == s.plan_id).first()
        vencida   = s.fecha_fin < hoy
        agotada   = s.sesiones_usadas >= plan.sesiones_incluidas
        disponibles = plan.sesiones_incluidas - s.sesiones_usadas
        icon = "🔴" if (vencida or agotada) else "🟢"
        with st.expander(f"{icon} {pac.nombre} {pac.apellido} — {plan.nombre} — vence {s.fecha_fin}"):
            c1, c2, c3 = st.columns(3)
            c1.metric("Sesiones incluidas", plan.sesiones_incluidas)
            c2.metric("Usadas", s.sesiones_usadas)
            c3.metric("Disponibles", disponibles)
            if vencida: st.warning("⚠️ Suscripción vencida")
            if agotada: st.warning("⚠️ Sesiones agotadas")
            if st.button("❌ Desactivar suscripción", key=f"deact_sub_{s.id}"):
                s.activo = False; db.commit(); st.rerun()
    db.close()


def _reportes():
    db  = SessionLocal()
    st.subheader("Reportes de Ingresos")

    tipo = st.radio("Tipo de reporte", ["Semanal", "Mensual"], horizontal=True)

    hoy = date.today()
    if tipo == "Semanal":
        inicio = hoy - timedelta(days=hoy.weekday())
        fin    = inicio + timedelta(days=6)
        titulo = f"Semana del {inicio} al {fin}"
    else:
        inicio = hoy.replace(day=1)
        fin    = (inicio.replace(month=inicio.month % 12 + 1, day=1) - timedelta(days=1))
        titulo = f"Mes de {inicio.strftime('%B %Y')}"

    inicio_str = str(inicio)
    fin_str    = str(fin)

    facturas = db.query(Factura).filter(
        Factura.fecha >= inicio_str,
        Factura.fecha <= fin_str,
        Factura.estado.in_([EstadoFactura.emitida, EstadoFactura.pagada])
    ).all()

    st.markdown(f"### 📊 {titulo}")
    total    = sum(f.total for f in facturas)
    pagadas  = sum(f.total for f in facturas if f.estado.value == "pagada")
    pendiente = total - pagadas

    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Total Facturas", len(facturas))
    c2.metric("💰 Total período", f"${total:,.0f}")
    c3.metric("✅ Cobrado", f"${pagadas:,.0f}")
    c4.metric("⏳ Pendiente", f"${pendiente:,.0f}")

    if facturas:
        st.markdown("---")
        st.markdown("**Detalle:**")
        rows = []
        for f in facturas:
            pac = db.query(Paciente).filter(Paciente.id == f.paciente_id).first()
            rows.append({
                "N° Factura": f.numero,
                "Paciente":   f"{pac.nombre} {pac.apellido}" if pac else "?",
                "Fecha":      f.fecha,
                "Total":      f"${f.total:,.0f}",
                "Estado":     f.estado.value,
                "Método":     f.metodo_pago.value if f.metodo_pago else "-",
            })
        df = pd.DataFrame(rows)
        st.dataframe(df, width='stretch', hide_index=True)

        # Descargar como CSV
        csv = df.to_csv(index=False).encode("utf-8")
        st.download_button(
            label="📥 Descargar reporte CSV",
            data=csv,
            file_name=f"reporte_{tipo.lower()}_{inicio_str}.csv",
            mime="text/csv"
        )
    else:
        st.info(f"No hay facturas en este período")
    db.close()
