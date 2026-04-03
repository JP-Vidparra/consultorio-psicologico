"""
page_recepcion.py — Calendario visual completo
Vista Mes / Semana / Día con filtros por psicólogo, paciente y plan
"""
import streamlit as st
import pandas as pd
from datetime import date, timedelta
import calendar
from db.models import (SessionLocal, Paciente, Cita, Suscripcion,
                       PlanSuscripcion, Usuario, EstadoCita, RolUsuario)

ESTADO_COLOR = {
    "programada":    "#f0ad4e",
    "confirmada":    "#5cb85c",
    "realizada":     "#5bc0de",
    "cancelada":     "#d9534f",
    "reprogramada":  "#9b59b6",
}
ESTADO_ICON = {
    "programada": "🟡", "confirmada": "🟢",
    "realizada": "✅", "cancelada": "🔴", "reprogramada": "🔵",
}


def render():
    st.title("📅 Recepción — Gestión de Citas")
    tab1, tab2, tab3 = st.tabs(["📆 Calendario", "➕ Nueva Cita", "👤 Pacientes"])
    with tab1: _calendario()
    with tab2: _nueva_cita()
    with tab3: _pacientes()


def _get_citas(db, inicio_str, fin_str, psi_id, pac_id, plan_id):
    q = db.query(Cita).filter(
        Cita.fecha_hora >= inicio_str,
        Cita.fecha_hora <= fin_str + " 23:59"
    )
    if psi_id:  q = q.filter(Cita.psicologo_id == psi_id)
    if pac_id:  q = q.filter(Cita.paciente_id == pac_id)
    if plan_id:
        subs_ids = [s.id for s in db.query(Suscripcion).filter(Suscripcion.plan_id == plan_id).all()]
        q = q.filter(Cita.suscripcion_id.in_(subs_ids))
    return q.order_by(Cita.fecha_hora).all()


def _calendario():
    db = SessionLocal()

    # Filtros
    with st.expander("🔍 Filtros", expanded=True):
        col1, col2, col3, col4 = st.columns(4)
        vista = col1.selectbox("Vista", ["Mes", "Semana", "Día"], key="cal_vista")

        psicologos = db.query(Usuario).filter(Usuario.rol == RolUsuario.psicologo, Usuario.activo == True).all()
        psi_opts = {"Todos": None} | {p.nombre: p.id for p in psicologos}
        psi_id = col2.selectbox("Psicólogo/a", list(psi_opts.keys()), key="cal_psi")
        psi_id = psi_opts[psi_id]

        pacientes = db.query(Paciente).filter(Paciente.activo == True).order_by(Paciente.apellido).all()
        pac_opts = {"Todos": None} | {f"{p.nombre} {p.apellido}": p.id for p in pacientes}
        pac_id = col3.selectbox("Paciente", list(pac_opts.keys()), key="cal_pac")
        pac_id = pac_opts[pac_id]

        planes = db.query(PlanSuscripcion).filter(PlanSuscripcion.activo == True).all()
        plan_opts = {"Todos": None} | {p.nombre: p.id for p in planes}
        plan_id = col4.selectbox("Plan", list(plan_opts.keys()), key="cal_plan")
        plan_id = plan_opts[plan_id]

    # Navegación
    if "cal_fecha_ref" not in st.session_state:
        st.session_state["cal_fecha_ref"] = date.today()
    fecha_ref = st.session_state["cal_fecha_ref"]

    col_prev, col_titulo, col_hoy, col_next = st.columns([1, 4, 1, 1])
    if col_prev.button("◀"):
        delta = {"Mes": lambda d: (d.replace(day=1) - timedelta(days=1)).replace(day=1),
                 "Semana": lambda d: d - timedelta(weeks=1),
                 "Día":    lambda d: d - timedelta(days=1)}
        st.session_state["cal_fecha_ref"] = delta[vista](fecha_ref)
        st.rerun()
    if col_hoy.button("Hoy"):
        st.session_state["cal_fecha_ref"] = date.today()
        st.rerun()
    if col_next.button("▶"):
        delta = {"Mes": lambda d: (d.replace(day=28) + timedelta(days=4)).replace(day=1),
                 "Semana": lambda d: d + timedelta(weeks=1),
                 "Día":    lambda d: d + timedelta(days=1)}
        st.session_state["cal_fecha_ref"] = delta[vista](fecha_ref)
        st.rerun()

    if vista == "Mes":
        _vista_mes(db, fecha_ref, col_titulo, psi_id, pac_id, plan_id)
    elif vista == "Semana":
        _vista_semana(db, fecha_ref, col_titulo, psi_id, pac_id, plan_id)
    else:
        _vista_dia(db, fecha_ref, col_titulo, psi_id, pac_id, plan_id)

    db.close()


def _vista_mes(db, fecha_ref, col_titulo, psi_id, pac_id, plan_id):
    MESES = ["","Enero","Febrero","Marzo","Abril","Mayo","Junio",
             "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
    DIAS  = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"]

    año, mes = fecha_ref.year, fecha_ref.month
    col_titulo.markdown(f"### {MESES[mes]} {año}")

    primer_dia  = date(año, mes, 1)
    _, total_dias = calendar.monthrange(año, mes)
    citas = _get_citas(db, str(primer_dia), f"{año}-{mes:02d}-{total_dias:02d}", psi_id, pac_id, plan_id)

    citas_por_dia = {}
    for c in citas:
        citas_por_dia.setdefault(c.fecha_hora[:10], []).append(c)

    hoy = str(date.today())
    offset = primer_dia.weekday()

    html = """
<style>
.cal-wrap{font-family:sans-serif;margin-top:8px}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:3px}
.cal-hdr{background:#1a1a2e;color:#fff;text-align:center;padding:8px 2px;
         border-radius:6px;font-weight:700;font-size:.82rem}
.cal-cell{background:#fff;border:1px solid #e9ecef;border-radius:8px;
          min-height:85px;padding:5px;box-sizing:border-box}
.cal-cell:hover{border-color:#667eea;background:#f5f3ff}
.cal-cell.hoy{border:2px solid #667eea;background:#eef2ff}
.cal-cell.vacio{background:transparent!important;border:none!important}
.cal-num{font-weight:700;font-size:.88rem;color:#444}
.cal-num.hoy-n{color:#667eea}
.cal-cita{font-size:.7rem;padding:2px 5px;border-radius:4px;margin:1px 0;
          color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cal-mas{font-size:.68rem;color:#667eea;font-weight:700}
.leyenda{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px}
.ley-item{display:flex;align-items:center;gap:5px;font-size:.8rem}
.ley-dot{width:12px;height:12px;border-radius:50%;flex-shrink:0}
</style>
<div class="cal-wrap"><div class="cal-grid">"""

    for d in DIAS:
        html += f'<div class="cal-hdr">{d}</div>'
    for _ in range(offset):
        html += '<div class="cal-cell vacio"></div>'

    for d in range(1, total_dias + 1):
        dia_str = f"{año}-{mes:02d}-{d:02d}"
        clase   = "cal-cell hoy" if dia_str == hoy else "cal-cell"
        n_clase = "cal-num hoy-n" if dia_str == hoy else "cal-num"
        html   += f'<div class="{clase}"><div class="{n_clase}">{d}</div>'
        cs = citas_por_dia.get(dia_str, [])
        for c in cs[:3]:
            pac   = db.query(Paciente).filter(Paciente.id == c.paciente_id).first()
            color = ESTADO_COLOR.get(c.estado.value, "#999")
            hora  = c.fecha_hora[11:16]
            nom   = pac.nombre[:9] if pac else "?"
            html += f'<div class="cal-cita" style="background:{color}" title="{hora} {pac.nombre if pac else ""} {pac.apellido if pac else ""}">{hora} {nom}</div>'
        if len(cs) > 3:
            html += f'<div class="cal-mas">+{len(cs)-3} más</div>'
        html += '</div>'

    html += '</div>'

    # Leyenda
    html += '<div class="leyenda">'
    for est, col in ESTADO_COLOR.items():
        html += f'<div class="ley-item"><div class="ley-dot" style="background:{col}"></div>{est.capitalize()}</div>'
    html += '</div></div>'
    st.markdown(html, unsafe_allow_html=True)

    st.markdown("---")
    st.markdown("**Ver citas de un día:**")
    dia_sel = st.date_input("", value=date.today(), key="mes_dia", label_visibility="collapsed")
    citas_dia = citas_por_dia.get(str(dia_sel), [])
    if citas_dia:
        _tabla_citas(db, citas_dia)
    else:
        st.info(f"No hay citas el {dia_sel.strftime('%d/%m/%Y')}")


def _vista_semana(db, fecha_ref, col_titulo, psi_id, pac_id, plan_id):
    DIAS = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"]
    lunes   = fecha_ref - timedelta(days=fecha_ref.weekday())
    domingo = lunes + timedelta(days=6)
    col_titulo.markdown(f"### Semana: {lunes.strftime('%d %b')} — {domingo.strftime('%d %b %Y')}")

    citas = _get_citas(db, str(lunes), str(domingo), psi_id, pac_id, plan_id)
    citas_por_dia = {}
    for c in citas:
        citas_por_dia.setdefault(c.fecha_hora[:10], []).append(c)

    hoy = str(date.today())

    html = """
<style>
.sem-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;margin-top:8px}
.sem-hdr{text-align:center;padding:10px 4px;border-radius:8px;font-weight:700;font-size:.85rem}
.sem-hdr.hoy-h{background:#667eea;color:#fff}
.sem-hdr.norm{background:#1a1a2e;color:#e0e0e0}
.sem-col{background:#f8f9fa;border-radius:8px;min-height:120px;padding:6px;
         border:1px solid #e9ecef}
.sem-col.hoy-c{border:2px solid #667eea;background:#eef2ff}
.sem-cita{font-size:.74rem;padding:4px 6px;border-radius:6px;margin:3px 0;color:#fff}
.sem-hora{font-size:.68rem;opacity:.9}
.sem-nom{font-weight:700}
.sem-vacio{color:#aaa;font-size:.8rem;text-align:center;padding-top:20px}
</style>
<div class="sem-grid">"""

    for i in range(7):
        dia = lunes + timedelta(days=i)
        cls = "sem-hdr hoy-h" if str(dia) == hoy else "sem-hdr norm"
        html += f'<div class="{cls}">{DIAS[i]}<br><span style="font-size:.8rem">{dia.strftime("%d %b")}</span></div>'

    for i in range(7):
        dia = lunes + timedelta(days=i)
        ds  = str(dia)
        cls = "sem-col hoy-c" if ds == hoy else "sem-col"
        html += f'<div class="{cls}">'
        cs = citas_por_dia.get(ds, [])
        if cs:
            for c in cs:
                pac   = db.query(Paciente).filter(Paciente.id == c.paciente_id).first()
                color = ESTADO_COLOR.get(c.estado.value, "#999")
                hora  = c.fecha_hora[11:16]
                nom   = f"{pac.nombre} {pac.apellido[:1]}." if pac else "?"
                html += (f'<div class="sem-cita" style="background:{color}">'
                         f'<div class="sem-hora">{hora}</div>'
                         f'<div class="sem-nom">{nom}</div></div>')
        else:
            html += '<div class="sem-vacio">Sin citas</div>'
        html += '</div>'
    html += '</div>'
    st.markdown(html, unsafe_allow_html=True)

    st.markdown("---")
    if citas:
        st.markdown(f"**{len(citas)} cita(s) esta semana:**")
        _tabla_citas(db, citas)
    else:
        st.info("No hay citas esta semana con los filtros seleccionados")


def _vista_dia(db, fecha_ref, col_titulo, psi_id, pac_id, plan_id):
    DIAS_ES = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"]
    col_titulo.markdown(
        f"### {DIAS_ES[fecha_ref.weekday()]} {fecha_ref.strftime('%d de %B de %Y')}")

    citas = _get_citas(db, str(fecha_ref), str(fecha_ref), psi_id, pac_id, plan_id)

    if not citas:
        st.info(f"No hay citas para el {fecha_ref.strftime('%d/%m/%Y')}")
        return

    # Timeline
    html = """
<style>
.tl{margin:12px 0}
.tl-row{display:flex;align-items:flex-start;margin-bottom:10px;gap:10px}
.tl-t{min-width:52px;font-weight:700;color:#667eea;font-size:.92rem;padding-top:6px;text-align:right}
.tl-dot{width:13px;height:13px;border-radius:50%;margin-top:8px;flex-shrink:0}
.tl-line{width:2px;background:#e2e8f0;flex:1;min-height:28px;margin:0 auto}
.tl-vl{display:flex;flex-direction:column;align-items:center;min-width:20px}
.tl-card{flex:1;border-radius:10px;padding:10px 14px;border-left:4px solid;background:#fafafa}
.tl-nom{font-weight:700;font-size:.95rem;color:#1a1a2e}
.tl-sub{font-size:.82rem;color:#555;margin-top:3px}
.tl-badge{display:inline-block;font-size:.74rem;padding:2px 9px;border-radius:10px;
          color:#fff;font-weight:600;margin-top:5px}
</style>
<div class="tl">"""

    for c in citas:
        pac  = db.query(Paciente).filter(Paciente.id == c.paciente_id).first()
        psic = db.query(Usuario).filter(Usuario.id == c.psicologo_id).first()
        sub  = db.query(Suscripcion).filter(Suscripcion.id == c.suscripcion_id).first() if c.suscripcion_id else None
        plan = db.query(PlanSuscripcion).filter(PlanSuscripcion.id == sub.plan_id).first() if sub else None
        hora  = c.fecha_hora[11:16]
        color = ESTADO_COLOR.get(c.estado.value, "#ccc")
        plan_txt = f"📋 {plan.nombre}" if plan else "Sin plan"
        html += f"""
<div class="tl-row">
  <div class="tl-t">{hora}</div>
  <div class="tl-vl"><div class="tl-dot" style="background:{color}"></div><div class="tl-line"></div></div>
  <div class="tl-card" style="border-color:{color}">
    <div class="tl-nom">👤 {pac.nombre if pac else '?'} {pac.apellido if pac else ''}</div>
    <div class="tl-sub">🧠 {psic.nombre if psic else '?'} &nbsp;·&nbsp; ⏱ {c.duracion_min} min &nbsp;·&nbsp; {plan_txt}</div>
    <span class="tl-badge" style="background:{color}">{c.estado.value.upper()}</span>
  </div>
</div>"""
    html += '</div>'
    st.markdown(html, unsafe_allow_html=True)

    st.markdown("---")
    _tabla_citas(db, citas)


def _tabla_citas(db, citas):
    for c in citas:
        pac  = db.query(Paciente).filter(Paciente.id == c.paciente_id).first()
        psic = db.query(Usuario).filter(Usuario.id == c.psicologo_id).first()
        icon = ESTADO_ICON.get(c.estado.value, "⚪")
        with st.expander(
            f"{icon} {c.fecha_hora} — **{pac.nombre if pac else '?'} "
            f"{pac.apellido if pac else ''}** — {psic.nombre if psic else '?'}"
        ):
            col1, col2, col3, col4 = st.columns(4)
            if col1.button("✅ Confirmar", key=f"co_{c.id}"):
                c.estado = EstadoCita.confirmada; db.commit(); st.rerun()
            if col2.button("✔️ Realizada",  key=f"re_{c.id}"):
                c.estado = EstadoCita.realizada;  db.commit(); st.rerun()
            if col3.button("❌ Cancelar",   key=f"ca_{c.id}"):
                c.estado = EstadoCita.cancelada;  db.commit(); st.rerun()
            with col4.popover("🔄 Reprogramar"):
                nf = st.date_input("Nueva fecha", key=f"nf_{c.id}")
                nh = st.time_input("Nueva hora",  key=f"nh_{c.id}")
                mo = st.text_area("Motivo",        key=f"mo_{c.id}")
                if st.button("Confirmar", key=f"rb_{c.id}"):
                    c.fecha_hora = f"{nf} {nh.strftime('%H:%M')}"
                    c.estado = EstadoCita.reprogramada
                    c.motivo_reprogramacion = mo
                    db.commit(); st.success("✅ Reprogramada"); st.rerun()


def _nueva_cita():
    db = SessionLocal()
    st.subheader("Programar Nueva Cita")
    pacientes  = db.query(Paciente).filter(Paciente.activo == True).order_by(Paciente.apellido).all()
    psicologos = db.query(Usuario).filter(Usuario.rol == RolUsuario.psicologo, Usuario.activo == True).all()

    if not pacientes:
        st.warning("Registra pacientes primero.")
        db.close(); return

    with st.form("form_cita", clear_on_submit=False):
        c1, c2 = st.columns(2)
        pac_opts = {f"{p.nombre} {p.apellido} — {p.documento}": p.id for p in pacientes}
        pac_id  = pac_opts[c1.selectbox("Paciente *", list(pac_opts.keys()))]
        psi_opts = {p.nombre: p.id for p in psicologos}
        psi_id  = psi_opts[c2.selectbox("Psicólogo/a *", list(psi_opts.keys()))]
        fecha   = c1.date_input("Fecha *", min_value=date.today())
        hora    = c2.time_input("Hora *")
        dur     = c1.selectbox("Duración", [30,45,60,90], index=2, format_func=lambda x: f"{x} min")
        notas   = st.text_area("Notas de recepción")

        subs = db.query(Suscripcion).filter(
            Suscripcion.paciente_id == pac_id, Suscripcion.activo == True,
            Suscripcion.fecha_fin >= str(date.today())).all()

        sub_id = None
        if subs:
            st.markdown("---")
            sub_opts = {}
            for s in subs:
                plan = db.query(PlanSuscripcion).filter(PlanSuscripcion.id == s.plan_id).first()
                disp = plan.sesiones_incluidas - s.sesiones_usadas
                sub_opts[f"{plan.nombre} — {disp} sesiones disp."] = (s.id, disp)
            sel = st.selectbox("Plan", ["Sin plan"] + list(sub_opts.keys()))
            if sel != "Sin plan":
                sub_id_val, disp = sub_opts[sel]
                sub_id = sub_id_val if disp > 0 else None
                if disp <= 0: st.error("⚠️ Plan agotado")
                else: st.success(f"✅ {disp} sesiones disponibles")

        if st.form_submit_button("📅 Agendar Cita", type="primary"):
            cita = Cita(paciente_id=pac_id, psicologo_id=psi_id,
                        suscripcion_id=sub_id,
                        fecha_hora=f"{fecha} {hora.strftime('%H:%M')}",
                        duracion_min=dur, notas_recepcion=notas)
            db.add(cita)
            if sub_id:
                s = db.query(Suscripcion).filter(Suscripcion.id == sub_id).first()
                s.sesiones_usadas += 1
            db.commit()
            st.success(f"✅ Cita agendada el {fecha} a las {hora.strftime('%H:%M')}")
            st.session_state["cal_fecha_ref"] = fecha
    db.close()


def _pacientes():
    db = SessionLocal()
    st.subheader("Registro de Pacientes")
    if st.button("➕ Nuevo paciente"):
        st.session_state["nuevo_paciente"] = True
    if st.session_state.get("nuevo_paciente"):
        with st.form("fp", clear_on_submit=True):
            c1, c2 = st.columns(2)
            nom = c1.text_input("Nombre *"); ape = c2.text_input("Apellido *")
            doc = c1.text_input("Documento *"); fnac = c2.date_input("Nacimiento")
            tel = c1.text_input("Teléfono"); eml = c2.text_input("Email")
            mot = st.text_area("Motivo de consulta")
            s = st.form_submit_button("Registrar", type="primary")
            c = st.form_submit_button("Cancelar")
            if s:
                if not all([nom, ape, doc]):
                    st.error("Nombre, apellido y documento son obligatorios")
                else:
                    db.add(Paciente(nombre=nom, apellido=ape, documento=doc,
                                    fecha_nacimiento=str(fnac), telefono=tel,
                                    email=eml, motivo_consulta=mot))
                    db.commit(); st.success(f"✅ {nom} {ape} registrado")
                    st.session_state["nuevo_paciente"] = False; st.rerun()
            if c:
                st.session_state["nuevo_paciente"] = False; st.rerun()

    pacs = db.query(Paciente).filter(Paciente.activo == True).order_by(Paciente.apellido).all()
    if pacs:
        st.dataframe(pd.DataFrame([{
            "Nombre": f"{p.nombre} {p.apellido}", "Documento": p.documento,
            "Teléfono": p.telefono or "", "Email": p.email or "",
            "Motivo": (p.motivo_consulta or "")[:60]} for p in pacs]),
            width='stretch', hide_index=True)
    db.close()
