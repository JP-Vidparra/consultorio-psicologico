"""
app.py — CRM Consultorio Psicología
Punto de entrada principal — Streamlit

Correr: streamlit run app.py
"""
import streamlit as st
import streamlit.components.v1
import sys
from pathlib import Path

# Asegurar que el directorio raíz esté en el path
sys.path.insert(0, str(Path(__file__).parent))

# ─── Configuración de página ─────────────────────────────────────────────────
st.set_page_config(
    page_title="CRM Consultorio",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="expanded",
    menu_items={
        "About": "CRM Consultorio Psicología — v2.0",
        "Get help": None,
        "Report a bug": None,
    }
)

# ─── Estilos globales ─────────────────────────────────────────────────────────
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

/* ── Base ── */
html, body, [class*="css"] {
    font-family: 'Plus Jakarta Sans', sans-serif !important;
}

/* ── Ocultar elementos nativos ── */
#MainMenu, footer, header                           { visibility: hidden; }
[data-testid="stSidebarNavItems"]                   { display: none !important; }
[data-testid="stSidebarNavSeparator"]               { display: none !important; }
section[data-testid="stSidebarNav"]                 { display: none !important; }
[data-testid="stToolbar"], .stDeployButton          { display: none !important; }
button[title="Deploy this app"]                     { display: none !important; }

/* ── Sidebar — siempre visible, diseño premium ── */
[data-testid="stSidebar"] {
    background: linear-gradient(160deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%) !important;
    border-right: 1px solid rgba(139,92,246,0.2) !important;
    min-width: 270px !important;
    box-shadow: 4px 0 24px rgba(0,0,0,0.4) !important;
}

/* Botón de reabrir sidebar siempre visible */
[data-testid="collapsedControl"] {
    display:       flex !important;
    visibility:    visible !important;
    opacity:       1 !important;
    background:    linear-gradient(135deg, #1e1b4b, #0f172a) !important;
    border-radius: 0 10px 10px 0 !important;
    padding:       10px 8px !important;
    margin-top:    16px !important;
    box-shadow:    3px 0 12px rgba(139,92,246,0.4) !important;
    border:        1px solid rgba(139,92,246,0.3) !important;
    border-left:   none !important;
    z-index:       9999 !important;
}
[data-testid="collapsedControl"] svg { fill: #a78bfa !important; }

/* Texto del sidebar */
[data-testid="stSidebar"] p,
[data-testid="stSidebar"] span,
[data-testid="stSidebar"] div,
[data-testid="stSidebar"] label { color: #e2e8f0 !important; }

[data-testid="stSidebar"] h1,
[data-testid="stSidebar"] h2,
[data-testid="stSidebar"] h3 { color: #ffffff !important; }

/* Botones de navegación en sidebar */
[data-testid="stSidebar"] .stButton button {
    background:    rgba(255,255,255,0.04) !important;
    border:        1px solid rgba(255,255,255,0.1) !important;
    color:         #cbd5e1 !important;
    text-align:    left !important;
    width:         100% !important;
    margin:        3px 0 !important;
    border-radius: 10px !important;
    padding:       10px 16px !important;
    font-size:     0.88rem !important;
    font-weight:   600 !important;
    font-family:   'Plus Jakarta Sans', sans-serif !important;
    transition:    all .2s !important;
}
[data-testid="stSidebar"] .stButton button:hover {
    background:   rgba(139,92,246,0.2) !important;
    border-color: rgba(139,92,246,0.5) !important;
    color:        #ffffff !important;
    transform:    translateX(3px) !important;
}

/* Divider sidebar */
[data-testid="stSidebar"] hr {
    border-color: rgba(255,255,255,0.08) !important;
    margin: 10px 0 !important;
}

/* Sidebar metrics */
[data-testid="stSidebar"] [data-testid="metric-container"] {
    background:    rgba(255,255,255,0.06) !important;
    border:        1px solid rgba(255,255,255,0.1) !important;
    border-radius: 10px !important;
    padding:       10px 12px !important;
}
[data-testid="stSidebar"] [data-testid="stMetricValue"] {
    color: #a78bfa !important;
    font-size: 1.3rem !important;
    font-weight: 900 !important;
}
[data-testid="stSidebar"] [data-testid="stMetricLabel"] {
    color: #94a3b8 !important;
    font-size: .72rem !important;
}

/* ── Área de contenido principal ── */
.main .block-container {
    padding:    2rem 2.5rem 3rem !important;
    max-width:  1280px !important;
}

/* Fondo principal */
.stApp {
    background: #f8fafc !important;
}

/* ── Métricas en contenido ── */
[data-testid="metric-container"] {
    background:    #ffffff !important;
    border:        1.5px solid #e2e8f0 !important;
    border-radius: 14px !important;
    padding:       16px 18px !important;
    box-shadow:    0 2px 8px rgba(0,0,0,0.04) !important;
}
[data-testid="stMetricValue"]   { color: #1e1b4b !important; font-weight: 900 !important; }
[data-testid="stMetricLabel"]   { color: #64748b !important; font-weight: 600 !important; font-size: .8rem !important; }

/* ── Tabs ── */
.stTabs [data-baseweb="tab-list"] {
    gap:              4px !important;
    background:       #f1f5f9 !important;
    border-radius:    12px !important;
    padding:          4px !important;
    border:           none !important;
}
.stTabs [data-baseweb="tab"] {
    border-radius:    9px !important;
    padding:          8px 18px !important;
    font-weight:      700 !important;
    font-size:        .85rem !important;
    border:           none !important;
    color:            #64748b !important;
    background:       transparent !important;
}
.stTabs [data-baseweb="tab"][aria-selected="true"] {
    background:       #ffffff !important;
    color:            #4f46e5 !important;
    box-shadow:       0 2px 8px rgba(0,0,0,0.08) !important;
}
.stTabs [data-baseweb="tab-highlight"] { display: none !important; }
.stTabs [data-baseweb="tab-border"]    { display: none !important; }

/* ── Botones primarios ── */
.stButton button[kind="primary"],
button[data-testid="baseButton-primary"] {
    background:    linear-gradient(135deg, #4f46e5, #7c3aed) !important;
    border:        none !important;
    border-radius: 10px !important;
    font-weight:   700 !important;
    font-size:     .88rem !important;
    padding:       10px 20px !important;
    box-shadow:    0 4px 14px rgba(79,70,229,0.3) !important;
    transition:    all .2s !important;
}
.stButton button[kind="primary"]:hover {
    transform:     translateY(-1px) !important;
    box-shadow:    0 6px 20px rgba(79,70,229,0.4) !important;
}

/* Botones secundarios */
.stButton button[kind="secondary"],
button[data-testid="baseButton-secondary"] {
    border-radius: 10px !important;
    font-weight:   600 !important;
}

/* ── Inputs y selects ── */
[data-testid="stTextInput"] input,
[data-testid="stNumberInput"] input,
[data-testid="stTextArea"] textarea,
[data-baseweb="select"] {
    border-radius: 9px !important;
    border:        1.5px solid #e2e8f0 !important;
    font-family:   'Plus Jakarta Sans', sans-serif !important;
}
[data-testid="stTextInput"] input:focus,
[data-testid="stTextArea"] textarea:focus {
    border-color: #4f46e5 !important;
    box-shadow:   0 0 0 3px rgba(79,70,229,0.1) !important;
}

/* ── Expanders ── */
[data-testid="stExpander"] {
    border:        1.5px solid #e2e8f0 !important;
    border-radius: 12px !important;
    overflow:      hidden !important;
    margin-bottom: 8px !important;
    background:    #ffffff !important;
}
[data-testid="stExpander"] summary {
    font-weight:   700 !important;
    padding:       12px 16px !important;
    border-radius: 10px !important;
}
[data-testid="stExpander"] summary:hover {
    background: #f8fafc !important;
}

/* ── Dataframes ── */
[data-testid="stDataFrame"] {
    border-radius: 12px !important;
    overflow:      hidden !important;
    border:        1px solid #e2e8f0 !important;
}

/* ── Titulos ── */
h1 { color: #0f172a !important; font-weight: 900 !important; letter-spacing: -.03em !important; }
h2 { color: #1e293b !important; font-weight: 800 !important; }
h3 { color: #334155 !important; font-weight: 700 !important; }

/* ── Alertas / info boxes ── */
[data-testid="stAlert"] {
    border-radius: 10px !important;
    font-weight:   500 !important;
}

/* ── Scrollbar ── */
::-webkit-scrollbar       { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 6px; }
::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

/* ── Forzar sidebar siempre visible ── */
[data-testid="stSidebar"][aria-expanded="false"] {
    display: block !important;
    visibility: visible !important;
    width: 270px !important;
    min-width: 270px !important;
    transform: none !important;
    margin-left: 0 !important;
}

/* Botón de abrir sidebar — grande y muy visible ── */
[data-testid="collapsedControl"] {
    display:       flex !important;
    visibility:    visible !important;
    opacity:       1 !important;
    background:    linear-gradient(135deg,#4f46e5,#7c3aed) !important;
    border-radius: 0 12px 12px 0 !important;
    padding:       14px 10px !important;
    margin-top:    20px !important;
    box-shadow:    4px 0 20px rgba(79,70,229,0.5) !important;
    border:        2px solid rgba(139,92,246,0.6) !important;
    border-left:   none !important;
    z-index:       9999 !important;
    position:      fixed !important;
    left:          0 !important;
    top:           80px !important;
    cursor:        pointer !important;
    min-width:     28px !important;
    min-height:    48px !important;
}
[data-testid="collapsedControl"]::after {
    content:       "◀ Menú";
    color:         white !important;
    font-size:     .72rem !important;
    font-weight:   800 !important;
    writing-mode:  vertical-rl !important;
    letter-spacing:.08em !important;
}
[data-testid="collapsedControl"] svg {
    display: none !important;
}
</style>
""", unsafe_allow_html=True)

# ─── JavaScript: forzar sidebar abierto automáticamente ──────────────────────
st.components.v1.html("""
<script>
(function keepSidebarOpen() {
    function openSidebar() {
        // Buscar botón colapsar/expandir
        const btns = document.querySelectorAll('[data-testid="collapsedControl"]');
        const sidebar = document.querySelector('[data-testid="stSidebar"]');
        if (sidebar) {
            const isCollapsed = sidebar.getAttribute('aria-expanded') === 'false';
            if (isCollapsed) {
                // Hacer click en el botón para abrir
                const btn = document.querySelector('[data-testid="collapsedControl"]');
                if (btn) btn.click();
            }
        }
    }

    // Ejecutar al cargar
    setTimeout(openSidebar, 300);
    setTimeout(openSidebar, 800);
    setTimeout(openSidebar, 1500);

    // Observar cambios en el DOM para re-abrir si se cierra
    const observer = new MutationObserver(function(mutations) {
        const sidebar = document.querySelector('[data-testid="stSidebar"]');
        if (sidebar && sidebar.getAttribute('aria-expanded') === 'false') {
            setTimeout(openSidebar, 200);
        }
    });

    setTimeout(() => {
        const app = document.querySelector('.stApp');
        if (app) {
            observer.observe(app, { attributes: true, childList: true, subtree: true });
        }
    }, 1000);
})();
</script>
""", height=0)

# ─── Inicializar DB ───────────────────────────────────────────────────────────
from db.models import Base, engine
Base.metadata.create_all(bind=engine)

# ─── Auth ─────────────────────────────────────────────────────────────────────
from utils.auth import login_screen, logout, require_auth, get_current_user, ROLE_LABELS

if not require_auth():
    login_screen()
    st.stop()

# ─── Usuario autenticado ──────────────────────────────────────────────────────
user = get_current_user()
rol  = user["rol"]

# ─── Sidebar ──────────────────────────────────────────────────────────────────
with st.sidebar:
    # Logo + usuario
    rol_icon = {"admin":"⚙️","psicologo":"🧠","recepcionista":"📅","facturacion":"💰"}.get(rol,"👤")
    st.markdown(f"""
    <div style="padding:16px 4px 8px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
        <div style="width:42px;height:42px;border-radius:12px;
                    background:linear-gradient(135deg,#8b5cf6,#06b6d4);
                    display:flex;align-items:center;justify-content:center;font-size:20px">🧠</div>
        <div>
          <div style="color:#fff;font-weight:900;font-size:1rem;letter-spacing:-.02em">CRM Consultorio</div>
          <div style="color:rgba(255,255,255,.4);font-size:.7rem">Psicología Integral</div>
        </div>
      </div>
      <div style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);
                  border-radius:10px;padding:10px 12px">
        <div style="color:#fff;font-weight:700;font-size:.88rem">{rol_icon} {user['name']}</div>
        <div style="color:rgba(255,255,255,.45);font-size:.72rem">{ROLE_LABELS.get(rol, rol)}</div>
      </div>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("---")

    # Menú según rol
    MENUS = {
        "admin": [
            ("📊 Dashboard KPI",    "kpis"),
            ("⚙️ Administración",   "admin"),
            ("📅 Agenda",           "recepcion"),
            ("🧾 Facturación",      "facturacion"),
            ("🧠 Panel Psicólogo",  "psicologo"),
        ],
        "recepcionista": [
            ("📅 Agenda y Citas",   "recepcion"),
        ],
        "psicologo": [
            ("📊 Mi Dashboard",     "psicologo"),
            ("📅 Agenda",           "recepcion"),
        ],
        "facturacion": [
            ("📊 Dashboard KPI",    "kpis"),
            ("💰 Facturación",      "facturacion"),
            ("📅 Agenda",           "recepcion"),
        ],
    }

    opciones = MENUS.get(rol, [])
    if "page" not in st.session_state:
        st.session_state["page"] = opciones[0][1] if opciones else "admin"

    for label, key in opciones:
        is_active = st.session_state["page"] == key
        btn_label = f"**{label}**" if is_active else label
        if st.button(label, key=f"nav_{key}", use_container_width=True):
            st.session_state["page"] = key
            st.rerun()

    st.markdown("---")

    # Dashboard rápido en sidebar
    from db.models import SessionLocal, Cita, Paciente, Factura, Suscripcion, EstadoCita, EstadoFactura
    from datetime import date, timedelta
    db  = SessionLocal()
    hoy = date.today()
    hoy_str = str(hoy)
    ini_mes = str(hoy.replace(day=1))

    citas_hoy  = db.query(Cita).filter(Cita.fecha_hora.startswith(hoy_str),
                    Cita.estado != EstadoCita.cancelada).count()
    citas_pend = db.query(Cita).filter(Cita.fecha_hora >= hoy_str,
                    Cita.estado == EstadoCita.programada).count()
    total_pac  = db.query(Paciente).filter(Paciente.activo == True).count()
    subs_act   = db.query(Suscripcion).filter(Suscripcion.activo == True,
                    Suscripcion.fecha_fin >= hoy_str).count()

    # Ingresos del mes
    facturas_mes = db.query(Factura).filter(
        Factura.fecha >= ini_mes,
        Factura.estado.in_([EstadoFactura.emitida, EstadoFactura.pagada])).all()
    ing_mes = sum(f.total for f in facturas_mes)
    db.close()

    st.markdown("**📊 Hoy**")
    c1, c2 = st.columns(2)
    c1.metric("📅 Citas", citas_hoy)
    c2.metric("👥 Pacientes", total_pac)
    c1.metric("🟡 Pendientes", citas_pend)
    c2.metric("📋 Suscripc.", subs_act)

    if ing_mes > 0:
        st.markdown(f"""
        <div style="background:rgba(139,92,246,.15);border:1px solid rgba(139,92,246,.25);
                    border-radius:8px;padding:8px 10px;margin-top:4px;text-align:center">
          <div style="color:#a78bfa;font-size:.7rem;font-weight:700">💰 INGRESOS MES</div>
          <div style="color:#e9d5ff;font-size:.95rem;font-weight:900">${ing_mes/1e6:.1f}M COP</div>
        </div>""", unsafe_allow_html=True)

    st.markdown("---")
    if st.button("🚪 Cerrar Sesión", use_container_width=True):
        logout()

# ─── Renderizar página activa ──────────────────────────────────────────────────
page = st.session_state.get("page", "admin")

if page == "kpis" and rol in ["admin","facturacion"]:
    from pages.page_kpis import render
    render()

elif page == "admin" and rol in ["admin"]:
    from pages.page_admin import render
    render()

elif page == "recepcion":
    from pages.page_recepcion import render
    render()

elif page == "psicologo":
    from pages.page_psicologo import render
    render()

elif page == "facturacion":
    from pages.page_facturacion import render
    render()

else:
    st.warning("Página no disponible para tu rol")
