"""
page_recepcion.py — Diseño visual mejorado
- Sin paciente predeterminado
- Orden alfabético, por plan, por estado de citas
- UI colorida, intuitiva, tarjetas con iconos
"""
import streamlit as st
import pandas as pd
from datetime import date, timedelta
import calendar
from db.models import (SessionLocal, Paciente, Cita, Suscripcion,
                       PlanSuscripcion, Usuario, EstadoCita, RolUsuario)

ESTADO_COLOR = {
    "programada":   "#f59e0b",
    "confirmada":   "#10b981",
    "realizada":    "#3b82f6",
    "cancelada":    "#ef4444",
    "reprogramada": "#8b5cf6",
}
ESTADO_BG = {
    "programada":   "#fef3c7",
    "confirmada":   "#d1fae5",
    "realizada":    "#dbeafe",
    "cancelada":    "#fee2e2",
    "reprogramada": "#ede9fe",
}
ESTADO_ICON = {
    "programada": "🟡", "confirmada": "🟢",
    "realizada": "✅", "cancelada": "🔴", "reprogramada": "🔵",
}

CSS = """
<style>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

.blk * { font-family: 'Plus Jakarta Sans', sans-serif !important; }

/* ── Tarjetas de paciente ── */
.pac-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr));
            gap:14px; margin-top:12px; }
.pac-card { background:#fff; border-radius:14px; padding:16px;
            border:1.5px solid #e5e7eb; cursor:pointer;
            transition: transform .15s, box-shadow .15s, border-color .15s; }
.pac-card:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(0,0,0,.09);
                  border-color:#6366f1; }
.pac-card.tiene-cita { border-left:4px solid #10b981; }
.pac-card.sin-sub    { border-left:4px solid #d1d5db; }
.pac-avatar { width:44px; height:44px; border-radius:50%;
              display:flex; align-items:center; justify-content:center;
              font-weight:800; font-size:1.1rem; color:#fff; flex-shrink:0; }
.pac-name  { font-weight:700; font-size:.95rem; color:#111827; }
.pac-doc   { font-size:.78rem; color:#6b7280; }
.pac-badge { display:inline-block; font-size:.7rem; padding:2px 8px;
             border-radius:20px; font-weight:600; margin-top:5px; }

/* ── Calendario ── */
.cal-wrap  { margin-top:8px; }
.cal-grid  { display:grid; grid-template-columns:repeat(7,1fr); gap:3px; }
.cal-hdr   { background:#1e1b4b; color:#c7d2fe; text-align:center;
             padding:9px 2px; border-radius:7px; font-weight:700; font-size:.8rem; }
.cal-cell  { background:#fff; border:1.5px solid #f1f5f9; border-radius:9px;
             min-height:88px; padding:6px; cursor:pointer; transition:.15s; }
.cal-cell:hover { border-color:#6366f1; background:#f5f3ff; }
.cal-cell.hoy  { border:2px solid #6366f1; background:#eef2ff; }
.cal-cell.vacio{ background:transparent!important; border:none!important; cursor:default; }
.cal-num   { font-weight:700; font-size:.85rem; color:#374151; }
.cal-num.h { color:#6366f1; }
.cal-ev    { font-size:.68rem; padding:2px 5px; border-radius:4px; margin:1px 0;
             color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.cal-mas   { font-size:.67rem; color:#6366f1; font-weight:700; }

/* ── Semana ── */
.sem-grid  { display:grid; grid-template-columns:repeat(7,1fr); gap:5px; }
.sem-hdr   { text-align:center; padding:10px 4px; border-radius:9px; font-weight:700;
             font-size:.82rem; }
.sem-hdr.h { background:linear-gradient(135deg,#6366f1,#8b5cf6); color:#fff; }
.sem-hdr.n { background:#1e1b4b; color:#c7d2fe; }
.sem-col   { background:#fff; border-radius:9px; min-height:130px; padding:7px;
             border:1.5px solid #f1f5f9; }
.sem-col.h { border:2px solid #6366f1; background:#f5f3ff; }
.sem-ev    { font-size:.73rem; padding:4px 6px; border-radius:7px; margin:3px 0; color:#fff; }
.sem-hora  { font-size:.67rem; opacity:.9; }
.sem-nom   { font-weight:700; }
.sem-empty { color:#9ca3af; font-size:.78rem; text-align:center; padding-top:18px; }

/* ── Timeline día ── */
.tl-row   { display:flex; align-items:flex-start; gap:10px; margin-bottom:12px; }
.tl-t     { min-width:50px; font-weight:800; color:#6366f1; font-size:.9rem;
            padding-top:6px; text-align:right; }
.tl-vl    { display:flex; flex-direction:column; align-items:center; min-width:18px; }
.tl-dot   { width:13px; height:13px; border-radius:50%; flex-shrink:0; margin-top:7px; }
.tl-line  { width:2px; background:#e5e7eb; flex:1; min-height:26px; }
.tl-card  { flex:1; border-radius:11px; padding:11px 14px; border-left:4px solid; }
.tl-nom   { font-weight:700; font-size:.93rem; color:#111827; }
.tl-info  { font-size:.8rem; color:#6b7280; margin-top:3px; }
.tl-badge { display:inline-block; font-size:.72rem; padding:2px 9px; border-radius:10px;
            color:#fff; font-weight:700; margin-top:5px; }

/* ── Leyenda ── */
.leyenda  { display:flex; gap:10px; flex-wrap:wrap; margin-top:10px; }
.ley-item { display:flex; align-items:center; gap:5px; font-size:.78rem; color:#374151; }
.ley-dot  { width:11px; height:11px; border-radius:50%; flex-shrink:0; }

/* ── Stats cards ── */
.stat-row { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:16px; }
.stat-card{ border-radius:12px; padding:14px 16px; }
.stat-num { font-size:1.6rem; font-weight:800; }
.stat-lbl { font-size:.78rem; font-weight:600; opacity:.8; margin-top:2px; }
</style>
"""

def render():
    st.markdown(f'<div class="blk">{CSS}</div>', unsafe_allow_html=True)
    st.title("📅 Recepción — Gestión de Citas")
    tab1, tab2, tab3 = st.tabs(["📆 Calendario", "➕ Nueva Cita", "👥 Pacientes"])
    with tab1: _calendario()
    with tab2: _nueva_cita()
    with tab3: _pacientes()


# ─── CALENDARIO ──────────────────────────────────────────────────────────────

def _get_citas(db, inicio, fin, psi_id, pac_id, plan_id):
    q = db.query(Cita).filter(
        Cita.fecha_hora >= inicio,
        Cita.fecha_hora <= fin + " 23:59"
    )
    if psi_id:  q = q.filter(Cita.psicologo_id == psi_id)
    if pac_id:  q = q.filter(Cita.paciente_id == pac_id)
    if plan_id:
        ids = [s.id for s in db.query(Suscripcion).filter(Suscripcion.plan_id == plan_id).all()]
        q = q.filter(Cita.suscripcion_id.in_(ids))
    return q.order_by(Cita.fecha_hora).all()


def _calendario():
    db = SessionLocal()

    # Stats rápidas
    hoy_str = str(date.today())
    c_hoy   = db.query(Cita).filter(Cita.fecha_hora.startswith(hoy_str),
                Cita.estado != EstadoCita.cancelada).count()
    c_prog  = db.query(Cita).filter(Cita.estado == EstadoCita.programada).count()
    c_conf  = db.query(Cita).filter(Cita.estado == EstadoCita.confirmada).count()
    c_real  = db.query(Cita).filter(Cita.estado == EstadoCita.realizada).count()

    st.markdown(f"""
    <div class="stat-row blk">
      <div class="stat-card" style="background:#eef2ff;color:#4338ca">
        <div class="stat-num">{c_hoy}</div><div class="stat-lbl">📅 Citas hoy</div></div>
      <div class="stat-card" style="background:#fef3c7;color:#b45309">
        <div class="stat-num">{c_prog}</div><div class="stat-lbl">🟡 Programadas</div></div>
      <div class="stat-card" style="background:#d1fae5;color:#065f46">
        <div class="stat-num">{c_conf}</div><div class="stat-lbl">🟢 Confirmadas</div></div>
      <div class="stat-card" style="background:#dbeafe;color:#1e40af">
        <div class="stat-num">{c_real}</div><div class="stat-lbl">✅ Realizadas</div></div>
    </div>""", unsafe_allow_html=True)

    # Filtros
    with st.expander("🔍 Filtros", expanded=False):
        col1, col2, col3, col4 = st.columns(4)
        vista = col1.selectbox("Vista", ["Mes", "Semana", "Día"], key="cal_vista")
        psics = db.query(Usuario).filter(Usuario.rol == RolUsuario.psicologo, Usuario.activo == True).all()
        psi_o = {"Todos": None} | {p.nombre: p.id for p in psics}
        psi_id = psi_o[col2.selectbox("Psicólogo/a", list(psi_o.keys()), key="cal_psi")]
        pacs = db.query(Paciente).filter(Paciente.activo == True).order_by(Paciente.apellido).all()
        pac_o = {"Todos": None} | {f"{p.nombre} {p.apellido}": p.id for p in pacs}
        pac_id = pac_o[col3.selectbox("Paciente", list(pac_o.keys()), key="cal_pac")]
        planes = db.query(PlanSuscripcion).filter(PlanSuscripcion.activo == True).all()
        plan_o = {"Todos": None} | {p.nombre: p.id for p in planes}
        plan_id = plan_o[col4.selectbox("Plan", list(plan_o.keys()), key="cal_plan")]

    # Navegación
    if "cal_fecha_ref" not in st.session_state:
        st.session_state["cal_fecha_ref"] = date.today()
    ref = st.session_state["cal_fecha_ref"]

    cp, ct, ch, cn = st.columns([1, 4, 1, 1])
    if cp.button("◀", key="cal_prev"):
        d = {"Mes": lambda d: (d.replace(day=1) - timedelta(days=1)).replace(day=1),
             "Semana": lambda d: d - timedelta(weeks=1),
             "Día": lambda d: d - timedelta(days=1)}
        st.session_state["cal_fecha_ref"] = d[vista](ref); st.rerun()
    if ch.button("Hoy", key="cal_hoy"):
        st.session_state["cal_fecha_ref"] = date.today(); st.rerun()
    if cn.button("▶", key="cal_next"):
        d = {"Mes": lambda d: (d.replace(day=28) + timedelta(days=4)).replace(day=1),
             "Semana": lambda d: d + timedelta(weeks=1),
             "Día": lambda d: d + timedelta(days=1)}
        st.session_state["cal_fecha_ref"] = d[vista](ref); st.rerun()

    if vista == "Mes":   _mes(db, ref, ct, psi_id, pac_id, plan_id)
    elif vista == "Semana": _semana(db, ref, ct, psi_id, pac_id, plan_id)
    else:                _dia(db, ref, ct, psi_id, pac_id, plan_id)
    db.close()


def _mes(db, ref, ct, psi_id, pac_id, plan_id):
    MESES = ["","Enero","Febrero","Marzo","Abril","Mayo","Junio",
             "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
    DIAS  = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"]
    año, mes = ref.year, ref.month
    ct.markdown(f"### 📅 {MESES[mes]} {año}")
    p1 = date(año, mes, 1); _, nd = calendar.monthrange(año, mes)
    citas = _get_citas(db, str(p1), f"{año}-{mes:02d}-{nd:02d}", psi_id, pac_id, plan_id)
    cpd = {}
    for c in citas: cpd.setdefault(c.fecha_hora[:10], []).append(c)

    # Sunday-start offset: weekday() returns 0=Mon...6=Sun → for Sun-start: (weekday+1)%7
    hoy = str(date.today()); off = (p1.weekday() + 1) % 7
    html = '<div class="cal-wrap blk"><div class="cal-grid">'
    for d in DIAS: html += f'<div class="cal-hdr">{d}</div>'
    for _ in range(off): html += '<div class="cal-cell vacio"></div>'
    for d in range(1, nd + 1):
        ds = f"{año}-{mes:02d}-{d:02d}"
        cls = "cal-cell hoy" if ds == hoy else "cal-cell"
        nc  = "cal-num h"   if ds == hoy else "cal-num"
        html += f'<div class="{cls}"><div class="{nc}">{d}</div>'
        cs = cpd.get(ds, [])
        for c in cs[:3]:
            pac = db.query(Paciente).filter(Paciente.id == c.paciente_id).first()
            col = ESTADO_COLOR.get(c.estado.value, "#999")
            h   = c.fecha_hora[11:16]
            n   = pac.nombre[:9] if pac else "?"
            html += f'<div class="cal-ev" style="background:{col}" title="{h} {n}">{h} {n}</div>'
        if len(cs) > 3: html += f'<div class="cal-mas">+{len(cs)-3}</div>'
        html += '</div>'
    html += '</div>'
    # Leyenda
    html += '<div class="leyenda">'
    for e, c in ESTADO_COLOR.items():
        html += f'<div class="ley-item"><div class="ley-dot" style="background:{c}"></div>{e.capitalize()}</div>'
    html += '</div></div>'
    st.markdown(html, unsafe_allow_html=True)

    st.markdown("---")
    dia_sel = st.date_input("📅 Ver citas del día:", value=date.today(), key="mds", label_visibility="visible")
    cs = cpd.get(str(dia_sel), [])
    if cs: _tabla(db, cs)
    else: st.info(f"No hay citas el {dia_sel.strftime('%d/%m/%Y')}")


def _semana(db, ref, ct, psi_id, pac_id, plan_id):
    DIAS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"]
    # Sunday-start week
    lun = ref - timedelta(days=(ref.weekday() + 1) % 7); dom = lun + timedelta(days=6)
    ct.markdown(f"### 📅 {lun.strftime('%d %b')} — {dom.strftime('%d %b %Y')}")
    citas = _get_citas(db, str(lun), str(dom), psi_id, pac_id, plan_id)
    cpd = {}
    for c in citas: cpd.setdefault(c.fecha_hora[:10], []).append(c)
    hoy = str(date.today())

    html = '<div class="blk"><div class="sem-grid">'
    for i in range(7):
        d = lun + timedelta(days=i)
        cls = "sem-hdr h" if str(d) == hoy else "sem-hdr n"
        html += f'<div class="{cls}">{DIAS[i]}<br><small>{d.strftime("%d %b")}</small></div>'
    for i in range(7):
        d = lun + timedelta(days=i); ds = str(d)
        cls = "sem-col h" if ds == hoy else "sem-col"
        html += f'<div class="{cls}">'
        cs = cpd.get(ds, [])
        if cs:
            for c in cs:
                pac = db.query(Paciente).filter(Paciente.id == c.paciente_id).first()
                col = ESTADO_COLOR.get(c.estado.value, "#999"); h = c.fecha_hora[11:16]
                n   = f"{pac.nombre} {pac.apellido[:1]}." if pac else "?"
                html += (f'<div class="sem-ev" style="background:{col}">'
                         f'<div class="sem-hora">{h}</div><div class="sem-nom">{n}</div></div>')
        else: html += '<div class="sem-empty">Sin citas</div>'
        html += '</div>'
    html += '</div></div>'
    st.markdown(html, unsafe_allow_html=True)
    st.markdown("---")
    if citas: _tabla(db, citas)
    else: st.info("Sin citas esta semana con los filtros seleccionados")


def _dia(db, ref, ct, psi_id, pac_id, plan_id):
    DIAS = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"]
    # weekday() → 0=Mon, convert to Sun=0 system: (weekday+1)%7
    dia_idx = (ref.weekday() + 1) % 7
    ct.markdown(f"### 📅 {DIAS[dia_idx]} {ref.strftime('%d/%m/%Y')}")
    citas = _get_citas(db, str(ref), str(ref), psi_id, pac_id, plan_id)
    if not citas: st.info(f"Sin citas el {ref.strftime('%d/%m/%Y')}"); return

    html = '<div class="blk">'
    for c in citas:
        pac  = db.query(Paciente).filter(Paciente.id == c.paciente_id).first()
        psic = db.query(Usuario).filter(Usuario.id == c.psicologo_id).first()
        sub  = db.query(Suscripcion).filter(Suscripcion.id == c.suscripcion_id).first() if c.suscripcion_id else None
        plan = db.query(PlanSuscripcion).filter(PlanSuscripcion.id == sub.plan_id).first() if sub else None
        h   = c.fecha_hora[11:16]; col = ESTADO_COLOR.get(c.estado.value, "#ccc")
        bg  = ESTADO_BG.get(c.estado.value, "#f9f9f9")
        plt = f"📋 {plan.nombre}" if plan else "Sin plan"
        html += f"""
<div class="tl-row">
  <div class="tl-t">{h}</div>
  <div class="tl-vl"><div class="tl-dot" style="background:{col}"></div><div class="tl-line"></div></div>
  <div class="tl-card" style="background:{bg};border-color:{col}">
    <div class="tl-nom">👤 {pac.nombre if pac else '?'} {pac.apellido if pac else ''}</div>
    <div class="tl-info">🧠 {psic.nombre if psic else '?'} &nbsp;·&nbsp; ⏱ {c.duracion_min} min &nbsp;·&nbsp; {plt}</div>
    <span class="tl-badge" style="background:{col}">{c.estado.value.upper()}</span>
  </div>
</div>"""
    html += '</div>'
    st.markdown(html, unsafe_allow_html=True)
    st.markdown("---"); _tabla(db, citas)


def _tabla(db, citas):
    st.markdown("**✏️ Acciones rápidas:**")
    for c in citas:
        pac  = db.query(Paciente).filter(Paciente.id == c.paciente_id).first()
        psic = db.query(Usuario).filter(Usuario.id == c.psicologo_id).first()
        icon = ESTADO_ICON.get(c.estado.value, "⚪")
        with st.expander(f"{icon} {c.fecha_hora} — **{pac.nombre if pac else '?'} "
                         f"{pac.apellido if pac else ''}** — {psic.nombre if psic else '?'}"):
            c1,c2,c3,c4 = st.columns(4)
            if c1.button("✅ Confirmar", key=f"co_{c.id}"):
                c.estado = EstadoCita.confirmada; db.commit(); st.rerun()
            if c2.button("✔️ Realizada",  key=f"re_{c.id}"):
                c.estado = EstadoCita.realizada;  db.commit(); st.rerun()
            if c3.button("❌ Cancelar",   key=f"ca_{c.id}"):
                c.estado = EstadoCita.cancelada;  db.commit(); st.rerun()
            with c4.popover("🔄 Reprogramar"):
                nf = st.date_input("Fecha", key=f"nf_{c.id}")
                nh = st.time_input("Hora",  key=f"nh_{c.id}")
                mo = st.text_area("Motivo", key=f"mo_{c.id}")
                if st.button("Confirmar", key=f"rb_{c.id}"):
                    c.fecha_hora = f"{nf} {nh.strftime('%H:%M')}"
                    c.estado = EstadoCita.reprogramada
                    c.motivo_reprogramacion = mo
                    db.commit(); st.success("✅ Reprogramada"); st.rerun()


# ─── NUEVA CITA ──────────────────────────────────────────────────────────────

def _nueva_cita():
    db = SessionLocal()
    st.subheader("➕ Programar Nueva Cita")

    pacientes  = db.query(Paciente).filter(Paciente.activo == True).order_by(Paciente.apellido).all()
    psicologos = db.query(Usuario).filter(Usuario.rol == RolUsuario.psicologo, Usuario.activo == True).all()

    if not pacientes:
        st.warning("⚠️ No hay pacientes registrados. Ve a la pestaña **Pacientes** y regístra uno primero.")
        db.close(); return

    # Sin paciente predeterminado — opción vacía al inicio
    pac_opts = {"— Selecciona un paciente —": None} | {
        f"{p.nombre} {p.apellido} — Doc: {p.documento}": p.id for p in pacientes}
    psi_opts = {p.nombre: p.id for p in psicologos}

    with st.form("form_cita", clear_on_submit=False):
        st.markdown("#### 👤 Datos de la cita")
        c1, c2 = st.columns(2)

        pac_sel = c1.selectbox("Paciente *", list(pac_opts.keys()), index=0)
        pac_id  = pac_opts[pac_sel]
        psi_sel = c2.selectbox("Psicólogo/a *", list(psi_opts.keys()))
        psi_id  = psi_opts[psi_sel]

        fecha   = c1.date_input("Fecha *", min_value=date.today())
        hora    = c2.time_input("Hora *")
        dur     = c1.selectbox("Duración", [30, 45, 60, 90], index=2,
                                format_func=lambda x: f"{x} minutos")
        notas   = st.text_area("Notas de recepción (opcional)")

        sub_id = None
        if pac_id:
            subs = db.query(Suscripcion).filter(
                Suscripcion.paciente_id == pac_id, Suscripcion.activo == True,
                Suscripcion.fecha_fin >= str(date.today())).all()
            if subs:
                st.markdown("---")
                st.markdown("#### 📋 Plan de suscripción")
                sub_opts = {"Sin plan": None}
                for s in subs:
                    plan = db.query(PlanSuscripcion).filter(PlanSuscripcion.id == s.plan_id).first()
                    disp = plan.sesiones_incluidas - s.sesiones_usadas
                    sub_opts[f"{plan.nombre} — {disp} sesiones disponibles (vence {s.fecha_fin})"] = (s.id, disp)
                sel = st.selectbox("Vincular a plan", list(sub_opts.keys()))
                if sel != "Sin plan" and sub_opts[sel]:
                    sid, disp = sub_opts[sel]
                    if disp <= 0: st.error("⚠️ Plan sin sesiones. Debe renovar.")
                    else:
                        sub_id = sid
                        st.success(f"✅ {disp} sesiones disponibles en este plan")
            else:
                st.info("ℹ️ Este paciente no tiene suscripción activa.")

        submitted = st.form_submit_button("📅 Agendar Cita", type="primary",
                                           use_container_width=True)
        if submitted:
            if not pac_id:
                st.error("⚠️ Debes seleccionar un paciente")
            else:
                cita = Cita(paciente_id=pac_id, psicologo_id=psi_id,
                            suscripcion_id=sub_id,
                            fecha_hora=f"{fecha} {hora.strftime('%H:%M')}",
                            duracion_min=dur, notas_recepcion=notas)
                db.add(cita)
                if sub_id:
                    s = db.query(Suscripcion).filter(Suscripcion.id == sub_id).first()
                    s.sesiones_usadas += 1
                db.commit()
                st.success(f"✅ Cita agendada para **{fecha.strftime('%d/%m/%Y')}** a las **{hora.strftime('%H:%M')}**")
                st.session_state["cal_fecha_ref"] = fecha
    db.close()


# ─── PACIENTES ────────────────────────────────────────────────────────────────

def _pacientes():
    db = SessionLocal()
    st.subheader("👥 Pacientes Registrados")

    # Controles de orden y filtro
    col1, col2, col3 = st.columns([2, 2, 1])
    orden  = col1.selectbox("Ordenar por", [
        "Alfabético (A→Z)", "Alfabético (Z→A)",
        "Plan activo", "Sin suscripción",
        "Más citas programadas", "Citas canceladas", "Citas realizadas"
    ], key="pac_orden")
    buscar = col2.text_input("🔍 Buscar paciente", placeholder="Nombre o documento...", key="pac_buscar")

    if col3.button("➕ Nuevo paciente", use_container_width=True):
        st.session_state["nuevo_pac"] = True

    if st.session_state.get("nuevo_pac"):
        with st.form("fp", clear_on_submit=True):
            st.markdown("#### Registrar nuevo paciente")
            c1, c2 = st.columns(2)
            nom  = c1.text_input("Nombre *");      ape  = c2.text_input("Apellido *")
            doc  = c1.text_input("Documento *")
            fnac = c2.date_input("Fecha nacimiento",
                                  value=date(1980, 1, 1),
                                  min_value=date(1900, 1, 1),
                                  max_value=date.today(),
                                  format="DD/MM/YYYY")
            tel  = c1.text_input("Teléfono");      eml  = c2.text_input("Email")
            mot  = st.text_area("Motivo de consulta")
            s = st.form_submit_button("✅ Registrar", type="primary")
            c = st.form_submit_button("Cancelar")
            if s:
                if not all([nom, ape, doc]):
                    st.error("Nombre, apellido y documento son obligatorios")
                else:
                    db.add(Paciente(nombre=nom, apellido=ape, documento=doc,
                                    fecha_nacimiento=str(fnac), telefono=tel,
                                    email=eml, motivo_consulta=mot))
                    db.commit(); st.success(f"✅ {nom} {ape} registrado")
                    st.session_state["nuevo_pac"] = False; st.rerun()
            if c: st.session_state["nuevo_pac"] = False; st.rerun()

    st.markdown("---")

    # Cargar todos los pacientes
    pacs = db.query(Paciente).filter(Paciente.activo == True).all()

    # Filtrar por búsqueda
    if buscar.strip():
        b = buscar.strip().lower()
        pacs = [p for p in pacs if b in p.nombre.lower() or b in p.apellido.lower()
                or b in (p.documento or "").lower()]

    # Enriquecer con datos
    def enriquecer(p):
        subs = db.query(Suscripcion).filter(
            Suscripcion.paciente_id == p.id, Suscripcion.activo == True,
            Suscripcion.fecha_fin >= str(date.today())).all()
        plan_nom = None
        if subs:
            plan = db.query(PlanSuscripcion).filter(PlanSuscripcion.id == subs[0].plan_id).first()
            plan_nom = plan.nombre if plan else None
        n_prog  = db.query(Cita).filter(Cita.paciente_id == p.id,
                                         Cita.estado == EstadoCita.programada).count()
        n_canc  = db.query(Cita).filter(Cita.paciente_id == p.id,
                                         Cita.estado == EstadoCita.cancelada).count()
        n_real  = db.query(Cita).filter(Cita.paciente_id == p.id,
                                         Cita.estado == EstadoCita.realizada).count()
        return {"pac": p, "plan": plan_nom, "n_prog": n_prog,
                "n_canc": n_canc, "n_real": n_real, "tiene_sub": bool(subs)}

    datos = [enriquecer(p) for p in pacs]

    # Ordenar
    if orden == "Alfabético (A→Z)":
        datos.sort(key=lambda x: x["pac"].apellido.lower())
    elif orden == "Alfabético (Z→A)":
        datos.sort(key=lambda x: x["pac"].apellido.lower(), reverse=True)
    elif orden == "Plan activo":
        datos.sort(key=lambda x: (not x["tiene_sub"], x["pac"].apellido.lower()))
    elif orden == "Sin suscripción":
        datos.sort(key=lambda x: (x["tiene_sub"], x["pac"].apellido.lower()))
    elif orden == "Más citas programadas":
        datos.sort(key=lambda x: x["n_prog"], reverse=True)
    elif orden == "Citas canceladas":
        datos.sort(key=lambda x: x["n_canc"], reverse=True)
    elif orden == "Citas realizadas":
        datos.sort(key=lambda x: x["n_real"], reverse=True)

    if not datos:
        st.info("No se encontraron pacientes"); db.close(); return

    # Colores para avatares
    AVATAR_COLS = ["#6366f1","#ec4899","#f59e0b","#10b981","#3b82f6","#8b5cf6","#ef4444"]

    # Tarjetas visuales
    html = '<div class="pac-grid blk">'
    for i, d in enumerate(datos):
        p    = d["pac"]
        ini  = (p.nombre[0] + p.apellido[0]).upper()
        acol = AVATAR_COLS[i % len(AVATAR_COLS)]
        cls  = "pac-card tiene-cita" if d["n_prog"] > 0 else ("pac-card" if d["tiene_sub"] else "pac-card sin-sub")
        plan_badge = (f'<span class="pac-badge" style="background:#dbeafe;color:#1e40af">'
                      f'📋 {d["plan"]}</span>') if d["plan"] else (
                     f'<span class="pac-badge" style="background:#f3f4f6;color:#6b7280">Sin plan</span>')
        stats = (f'<span style="font-size:.73rem;color:#6b7280">'
                 f'🟡 {d["n_prog"]} prog &nbsp; ✅ {d["n_real"]} real &nbsp; 🔴 {d["n_canc"]} canc</span>')
        html += f"""
<div class="{cls}">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
    <div class="pac-avatar" style="background:{acol}">{ini}</div>
    <div>
      <div class="pac-name">{p.nombre} {p.apellido}</div>
      <div class="pac-doc">📄 {p.documento} &nbsp;·&nbsp; 📞 {p.telefono or '-'}</div>
    </div>
  </div>
  {plan_badge}<br>{stats}
</div>"""
    html += '</div>'
    st.markdown(html, unsafe_allow_html=True)

    st.markdown("---")
    st.markdown(f"**{len(datos)} paciente(s) activo(s)**")
    db.close()
