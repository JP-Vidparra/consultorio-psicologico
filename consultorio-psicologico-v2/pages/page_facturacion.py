"""
page_facturacion.py — Módulo de Facturación
Sin selección predeterminada en ningún campo
"""
import streamlit as st
import pandas as pd
from datetime import date, timedelta
from db.models import (SessionLocal, Paciente, Factura, ItemFactura,
                       Suscripcion, PlanSuscripcion, Usuario, EstadoFactura, MetodoPago)
from utils.auth import get_current_user

EMPTY = "— Selecciona un paciente —"

def render():
    st.title("💰 Módulo de Facturación")
    tab1, tab2, tab3, tab4 = st.tabs(["🧾 Facturas", "➕ Nueva Factura", "📋 Suscripciones", "📊 Reportes"])
    with tab1: _facturas()
    with tab2: _nueva_factura()
    with tab3: _suscripciones()
    with tab4: _reportes()


def _facturas():
    db = SessionLocal()
    st.subheader("Listado de Facturas")
    c1, c2, c3, c4 = st.columns(4)
    estado_fil = c1.selectbox("Estado", ["Todos","borrador","emitida","pagada","anulada"], key="f_est")
    fecha_ini  = c2.date_input("Desde", value=date.today().replace(day=1), key="f_ini")
    fecha_fin  = c3.date_input("Hasta", value=date.today(), key="f_fin")

    # Filtro paciente sin predeterminado
    pacs = db.query(Paciente).filter(Paciente.activo == True).order_by(Paciente.apellido).all()
    pac_opts = {EMPTY: None} | {f"{p.apellido}, {p.nombre}": p.id for p in pacs}
    pac_fil_sel = c4.selectbox("Paciente", list(pac_opts.keys()), key="f_pac")
    pac_fil_id  = pac_opts[pac_fil_sel]

    q = db.query(Factura).filter(Factura.fecha >= str(fecha_ini), Factura.fecha <= str(fecha_fin))
    if estado_fil != "Todos":
        q = q.filter(Factura.estado == EstadoFactura(estado_fil))
    if pac_fil_id:
        q = q.filter(Factura.paciente_id == pac_fil_id)
    facturas = q.order_by(Factura.fecha.desc()).all()

    if not facturas:
        st.info("No hay facturas con los filtros seleccionados"); db.close(); return

    total_p = sum(f.total for f in facturas if f.estado.value in ["emitida","pagada"])
    cobrado = sum(f.total for f in facturas if f.estado.value == "pagada")
    c1b, c2b, c3b = st.columns(3)
    c1b.metric("💵 Total período", f"${total_p:,.0f}")
    c2b.metric("✅ Cobrado",        f"${cobrado:,.0f}")
    c3b.metric("⏳ Pendiente",      f"${total_p-cobrado:,.0f}")
    st.markdown("---")

    ICONS = {"borrador":"⬜","emitida":"🟡","pagada":"🟢","anulada":"🔴"}
    for f in facturas:
        pac = db.query(Paciente).filter(Paciente.id == f.paciente_id).first()
        with st.expander(f"{ICONS.get(f.estado.value,'⬜')} **{f.numero}** — {pac.apellido if pac else '?'}, {pac.nombre if pac else ''} — ${f.total:,.0f} COP — {f.fecha}"):
            items = db.query(ItemFactura).filter(ItemFactura.factura_id == f.id).all()
            col1, col2 = st.columns([3,1])
            with col1:
                if items:
                    st.dataframe(pd.DataFrame([{
                        "Descripción": i.descripcion,"Cant.": i.cantidad,
                        "Precio Unit.": f"${i.precio_unitario:,.0f}","Subtotal": f"${i.subtotal:,.0f}"
                    } for i in items]), use_container_width=True, hide_index=True)
                st.markdown(f"**Descuento:** ${f.descuento:,.0f} | **Total: ${f.total:,.0f} COP**")
                if f.notas: st.markdown(f"*{f.notas}*")
            with col2:
                st.markdown("**Acciones:**")
                if f.estado.value == "borrador":
                    if st.button("📤 Emitir", key=f"em_{f.id}"):
                        f.estado = EstadoFactura.emitida; db.commit(); st.rerun()
                if f.estado.value == "emitida":
                    mp = st.selectbox("Método", ["efectivo","transferencia","tarjeta","otro"], key=f"mp_{f.id}")
                    if st.button("✅ Pagada", key=f"pg_{f.id}"):
                        f.estado = EstadoFactura.pagada; f.metodo_pago = MetodoPago(mp)
                        db.commit(); st.rerun()
                if f.estado.value != "anulada":
                    if st.button("❌ Anular", key=f"an_{f.id}"):
                        f.estado = EstadoFactura.anulada; db.commit(); st.rerun()
    db.close()


def _nueva_factura():
    user = get_current_user()
    db   = SessionLocal()
    st.subheader("Crear Nueva Factura")

    pacientes = db.query(Paciente).filter(Paciente.activo == True).order_by(Paciente.apellido).all()
    if not pacientes:
        st.info("No hay pacientes registrados"); db.close(); return

    # Sin predeterminado
    pac_opts = {EMPTY: None} | {f"{p.apellido}, {p.nombre} — Doc: {p.documento}": p.id for p in pacientes}

    with st.form("form_factura", clear_on_submit=False):
        st.markdown("#### 👤 Datos generales")
        c1, c2 = st.columns(2)
        pac_sel = c1.selectbox("Paciente *", list(pac_opts.keys()), index=0, key="nf_pac")
        pac_id  = pac_opts[pac_sel]
        fecha   = c2.date_input("Fecha factura", value=date.today())
        notas   = st.text_area("Notas / observaciones")

        st.markdown("#### 🧾 Ítems de la factura")
        st.info("Agrega los servicios prestados. Deja en blanco los que no uses.")

        items_data = []
        for i in range(5):
            c1i, c2i, c3i = st.columns([4, 1, 2])
            desc   = c1i.text_input(f"Artículo {i+1}", placeholder="Ej: Sesión psicoterapia 60min", key=f"d_{i}")
            cant   = c2i.number_input("Cant.", min_value=1, value=1, key=f"c_{i}", label_visibility="visible")
            precio = c3i.number_input("Precio (COP)", min_value=0.0, step=10000.0, key=f"p_{i}")
            if desc.strip():
                items_data.append({"desc": desc, "cant": cant, "precio": precio})

        descuento = st.number_input("Descuento (COP)", min_value=0.0, step=5000.0)

        # Preview total
        if items_data:
            sub_prev = sum(it["cant"]*it["precio"] for it in items_data)
            tot_prev = max(0, sub_prev - descuento)
            st.markdown(f"**Subtotal:** ${sub_prev:,.0f} | **Descuento:** ${descuento:,.0f} | **Total: ${tot_prev:,.0f} COP**")

        s = st.form_submit_button("🧾 Crear Factura", type="primary", use_container_width=True)

        if s:
            if not pac_id:
                st.error("⚠️ Debes seleccionar un paciente")
            elif not items_data:
                st.error("⚠️ Agrega al menos un ítem")
            else:
                subtotal = sum(it["cant"]*it["precio"] for it in items_data)
                total    = max(0, subtotal - descuento)
                ultimo   = db.query(Factura).order_by(Factura.id.desc()).first()
                num_id   = (ultimo.id + 1) if ultimo else 1
                numero   = f"FACT-{date.today().year}-{num_id:04d}"
                factura  = Factura(numero=numero, paciente_id=pac_id, creador_id=user["id"],
                                   fecha=str(fecha), subtotal=subtotal, descuento=descuento,
                                   total=total, notas=notas)
                db.add(factura); db.flush()
                for it in items_data:
                    db.add(ItemFactura(factura_id=factura.id, descripcion=it["desc"],
                                       cantidad=it["cant"], precio_unitario=it["precio"],
                                       subtotal=it["cant"]*it["precio"]))
                db.commit()
                st.success(f"✅ Factura **{numero}** creada — Total: ${total:,.0f} COP")
    db.close()


def _suscripciones():
    db = SessionLocal()
    st.subheader("Suscripciones de Pacientes")

    if st.button("➕ Nueva Suscripción"):
        st.session_state["nueva_sub"] = True

    if st.session_state.get("nueva_sub"):
        pacientes = db.query(Paciente).filter(Paciente.activo == True).order_by(Paciente.apellido).all()
        planes    = db.query(PlanSuscripcion).filter(PlanSuscripcion.activo == True).all()

        with st.form("form_sub", clear_on_submit=True):
            st.markdown("**Nueva suscripción:**")
            c1, c2 = st.columns(2)

            # Sin predeterminado
            pac_opts2  = {EMPTY: None} | {f"{p.apellido}, {p.nombre}": p.id for p in pacientes}
            plan_opts2 = {f"{pl.nombre} — ${pl.precio:,.0f} COP": pl for pl in planes}

            pac_sel2  = c1.selectbox("Paciente *", list(pac_opts2.keys()), index=0, key="sub_pac")
            plan_sel2 = c2.selectbox("Plan *",     list(plan_opts2.keys()), key="sub_plan")
            pac_id2   = pac_opts2[pac_sel2]
            plan_obj2 = plan_opts2[plan_sel2]
            fecha_ini = c1.date_input("Fecha inicio", value=date.today())
            fecha_fin = fecha_ini + timedelta(days=plan_obj2.duracion_dias)
            c2.info(f"📅 Vence: **{fecha_fin}** ({plan_obj2.duracion_dias} días)")

            s = st.form_submit_button("✅ Crear suscripción", type="primary")
            c = st.form_submit_button("Cancelar")
            if s:
                if not pac_id2:
                    st.error("Selecciona un paciente")
                else:
                    db.add(Suscripcion(paciente_id=pac_id2, plan_id=plan_obj2.id,
                                       fecha_inicio=str(fecha_ini), fecha_fin=str(fecha_fin)))
                    db.commit(); st.success("✅ Suscripción creada")
                    st.session_state["nueva_sub"] = False; st.rerun()
            if c:
                st.session_state["nueva_sub"] = False; st.rerun()

    st.markdown("---")
    hoy  = str(date.today())
    subs = db.query(Suscripcion).filter(Suscripcion.activo == True).order_by(Suscripcion.fecha_fin).all()

    activas  = [s for s in subs if s.fecha_fin >= hoy]
    vencidas = [s for s in subs if s.fecha_fin < hoy]

    st.markdown(f"**{len(activas)} activas · {len(vencidas)} vencidas**")

    for s in activas + vencidas:
        pac  = db.query(Paciente).filter(Paciente.id == s.paciente_id).first()
        plan = db.query(PlanSuscripcion).filter(PlanSuscripcion.id == s.plan_id).first()
        vencida   = s.fecha_fin < hoy
        disp      = (plan.sesiones_incluidas - s.sesiones_usadas) if plan else 0
        icon      = "🔴" if (vencida or disp <= 0) else "🟢"

        with st.expander(f"{icon} {pac.apellido if pac else '?'}, {pac.nombre if pac else ''} — {plan.nombre if plan else '?'} — vence {s.fecha_fin}"):
            if plan:
                c1, c2, c3 = st.columns(3)
                c1.metric("Incluidas", plan.sesiones_incluidas)
                c2.metric("Usadas", s.sesiones_usadas)
                c3.metric("Disponibles", disp)
            if vencida: st.warning("⚠️ Suscripción vencida")
            if disp <= 0 and not vencida: st.warning("⚠️ Sesiones agotadas")
            if st.button("❌ Desactivar", key=f"ds_{s.id}"):
                s.activo = False; db.commit(); st.rerun()
    db.close()


def _reportes():
    db  = SessionLocal()
    st.subheader("Reportes de Ingresos")
    hoy = date.today()

    c1, c2 = st.columns([2, 3])
    tipo = c1.radio("Período", ["Semanal","Mensual","Rango personalizado"], horizontal=True)

    if tipo == "Semanal":
        ini = hoy - timedelta(days=hoy.weekday()); fin = ini + timedelta(days=6)
        titulo = f"Semana del {ini.strftime('%d/%m')} al {fin.strftime('%d/%m/%Y')}"
    elif tipo == "Mensual":
        ini = hoy.replace(day=1); fin = hoy
        titulo = f"Mes de {ini.strftime('%B %Y')}"
    else:
        col_a, col_b = c2.columns(2)
        ini = col_a.date_input("Desde", value=hoy.replace(day=1), key="rep_ini")
        fin = col_b.date_input("Hasta", value=hoy, key="rep_fin")
        titulo = f"Del {ini} al {fin}"

    facturas = db.query(Factura).filter(
        Factura.fecha >= str(ini), Factura.fecha <= str(fin),
        Factura.estado.in_([EstadoFactura.emitida, EstadoFactura.pagada])
    ).all()

    st.markdown(f"### 📊 {titulo}")

    total     = sum(f.total for f in facturas)
    pagadas   = sum(f.total for f in facturas if f.estado.value == "pagada")
    pendiente = total - pagadas
    c1k,c2k,c3k,c4k = st.columns(4)
    c1k.metric("📄 Facturas", len(facturas))
    c2k.metric("💰 Total",    f"${total:,.0f}")
    c3k.metric("✅ Cobrado",  f"${pagadas:,.0f}")
    c4k.metric("⏳ Pendiente",f"${pendiente:,.0f}")

    if facturas:
        st.markdown("---")
        rows = []
        for f in facturas:
            pac = db.query(Paciente).filter(Paciente.id == f.paciente_id).first()
            rows.append({
                "N° Factura": f.numero,
                "Paciente":   f"{pac.apellido if pac else '?'}, {pac.nombre if pac else ''}",
                "Fecha":      f.fecha, "Total": f"${f.total:,.0f}",
                "Estado":     f.estado.value, "Método": f.metodo_pago.value if f.metodo_pago else "—",
            })
        df = pd.DataFrame(rows)
        st.dataframe(df, use_container_width=True, hide_index=True)
        csv = df.to_csv(index=False).encode("utf-8")
        st.download_button("📥 Descargar CSV", data=csv,
                           file_name=f"reporte_{str(ini)}.csv", mime="text/csv")
    else:
        st.info("No hay facturas en este período")
    db.close()
