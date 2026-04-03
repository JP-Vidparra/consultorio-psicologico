"""
app.py — CRM Consultorio Psicología
Punto de entrada principal — Streamlit

Correr: streamlit run app.py
"""
import streamlit as st
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
/* ── Ocultar elementos nativos de Streamlit no necesarios ── */
#MainMenu          {visibility: hidden;}
footer             {visibility: hidden;}
header             {visibility: hidden;}

/* Ocultar navegación multi-página automática de Streamlit */
[data-testid="stSidebarNavItems"]     {display: none !important;}
[data-testid="stSidebarNavSeparator"] {display: none !important;}
section[data-testid="stSidebarNav"]   {display: none !important;}

/* Ocultar botón "Deploy" en el menú */
[data-testid="stToolbar"]             {display: none !important;}
.stDeployButton                       {display: none !important;}
button[title="Deploy this app"]       {display: none !important;}

/* Botón de abrir/cerrar sidebar — siempre visible */
[data-testid="collapsedControl"] {
    display: flex !important;
    visibility: visible !important;
    opacity: 1 !important;
    background: #1a1a2e !important;
    color: white !important;
    border-radius: 0 8px 8px 0 !important;
    padding: 8px 6px !important;
    margin-top: 12px !important;
    box-shadow: 2px 0 8px rgba(0,0,0,0.3) !important;
    z-index: 999 !important;
}

/* Sidebar */
[data-testid="stSidebar"] {
    background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
    min-width: 260px;
}
[data-testid="stSidebar"] * { color: #e0e0e0 !important; }
[data-testid="stSidebar"] .stButton button {
    background: transparent !important;
    border: 1px solid rgba(255,255,255,0.15) !important;
    color: #e0e0e0 !important;
    text-align: left !important;
    width: 100% !important;
    margin: 2px 0 !important;
    border-radius: 8px !important;
    padding: 8px 14px !important;
    font-size: 0.92rem !important;
}
[data-testid="stSidebar"] .stButton button:hover {
    background: rgba(255,255,255,0.1) !important;
    border-color: rgba(255,255,255,0.3) !important;
}

/* Métricas */
[data-testid="metric-container"] {
    background: #f8f9fa;
    border-radius: 12px;
    padding: 12px 16px;
    border: 1px solid #e9ecef;
}

/* Tabs */
.stTabs [data-baseweb="tab-list"] {
    gap: 8px;
}
.stTabs [data-baseweb="tab"] {
    border-radius: 8px 8px 0 0;
    padding: 8px 20px;
}

/* Botón primario */
.stButton button[kind="primary"] {
    background: linear-gradient(135deg, #667eea, #764ba2) !important;
    border: none !important;
    border-radius: 8px !important;
    font-weight: 600 !important;
}
</style>
""", unsafe_allow_html=True)

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
    st.markdown(f"### 🧠 CRM Consultorio")
    st.markdown(f"**{user['name']}**")
    st.markdown(f"*{ROLE_LABELS.get(rol, rol)}*")
    st.markdown("---")

    # Menú según rol
    MENUS = {
        "admin": [
            ("⚙️ Administración",   "admin"),
            ("📅 Agenda",           "recepcion"),
            ("🧾 Facturación",      "facturacion"),
            ("🧠 Notas Clínicas",   "psicologo"),
        ],
        "recepcionista": [
            ("📅 Agenda y Citas",   "recepcion"),
        ],
        "psicologo": [
            ("🧠 Mi Panel",         "psicologo"),
            ("📅 Mis Citas",        "recepcion"),
        ],
        "facturacion": [
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
        if st.button(label, key=f"nav_{key}", width='stretch'):
            st.session_state["page"] = key
            st.rerun()

    st.markdown("---")

    # Dashboard rápido en sidebar
    from db.models import SessionLocal, Cita, Paciente, EstadoCita
    from datetime import date
    db = SessionLocal()
    hoy = str(date.today())
    citas_hoy = db.query(Cita).filter(
        Cita.fecha_hora.startswith(hoy),
        Cita.estado != EstadoCita.cancelada
    ).count()
    total_pac = db.query(Paciente).filter(Paciente.activo == True).count()
    db.close()

    st.markdown("**📊 Hoy:**")
    col1, col2 = st.columns(2)
    col1.metric("Citas", citas_hoy)
    col2.metric("Pacientes", total_pac)

    st.markdown("---")
    if st.button("🚪 Cerrar Sesión", width='stretch'):
        logout()

# ─── Renderizar página activa ──────────────────────────────────────────────────
page = st.session_state.get("page", "admin")

if page == "admin" and rol in ["admin"]:
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
