"""
auth.py — Autenticación y manejo de sesión Streamlit
"""
import streamlit as st
from werkzeug.security import check_password_hash, generate_password_hash
from db.models import SessionLocal, Usuario, RolUsuario

ROLE_LABELS = {
    "admin":         "⚙️ Administrador",
    "psicologo":     "🧠 Psicólogo/a",
    "facturacion":   "💰 Facturación",
    "recepcionista": "📅 Recepcionista",
}

def login_screen():
    st.markdown("""
    <style>
    .login-box {
        max-width: 420px; margin: 60px auto; padding: 40px;
        background: #ffffff; border-radius: 16px;
        box-shadow: 0 4px 24px rgba(0,0,0,0.10);
    }
    .login-title { text-align:center; font-size:1.8rem; font-weight:700;
                   color:#1a1a2e; margin-bottom:8px; }
    .login-sub   { text-align:center; color:#666; margin-bottom:28px; font-size:.95rem; }
    </style>
    """, unsafe_allow_html=True)

    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        st.markdown('<div class="login-title">🧠 CRM Consultorio</div>', unsafe_allow_html=True)
        st.markdown('<div class="login-sub">Psicología Integral</div>', unsafe_allow_html=True)
        st.markdown("---")
        email    = st.text_input("📧 Correo electrónico", placeholder="usuario@consultorio.co")
        password = st.text_input("🔒 Contraseña", type="password", placeholder="••••••••")
        st.markdown("<br>", unsafe_allow_html=True)

        if st.button("Ingresar →", width='stretch', type="primary"):
            db = SessionLocal()
            user = db.query(Usuario).filter(
                Usuario.email == email.strip().lower(),
                Usuario.activo == True
            ).first()
            db.close()

            if user and check_password_hash(user.password_hash, password):
                st.session_state.user_id    = user.id
                st.session_state.user_name  = user.nombre
                st.session_state.user_email = user.email
                st.session_state.user_rol   = user.rol.value
                st.session_state.logged_in  = True
                st.rerun()
            else:
                st.error("Correo o contraseña incorrectos")

def logout():
    for k in ["user_id","user_name","user_email","user_rol","logged_in"]:
        st.session_state.pop(k, None)
    st.rerun()

def require_auth():
    return st.session_state.get("logged_in", False)

def get_current_user():
    return {
        "id":    st.session_state.get("user_id"),
        "name":  st.session_state.get("user_name"),
        "email": st.session_state.get("user_email"),
        "rol":   st.session_state.get("user_rol"),
    }

def change_password(user_id: int, new_password: str):
    db = SessionLocal()
    u = db.query(Usuario).filter(Usuario.id == user_id).first()
    if u:
        u.password_hash = generate_password_hash(new_password)
        db.commit()
    db.close()
