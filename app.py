import streamlit as st
import asyncio
import sys
import os

# Set page config at the very top (before any other st call)
st.set_page_config(
    page_title="Clara by Clinikally",
    page_icon="✨",
    layout="wide",
    initial_sidebar_state="expanded"
)

sys.path.append(os.path.dirname(__file__))
from agents.router import Router

# Custom premium CSS injection
st.markdown("""
<style>
    /* Import modern Google Fonts */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap');
    
    /* General styles */
    html, body, [data-testid="stAppViewContainer"] {
        font-family: 'Inter', sans-serif;
        background-color: #FCFDFD;
    }
    
    /* Title styling */
    h1, h2, h3, h4, h5, h6 {
        font-family: 'Outfit', sans-serif !important;
        font-weight: 700 !important;
        color: #1A252C !important;
    }
    
    /* Main title custom style */
    .clara-main-title {
        font-size: 2.8rem;
        background: linear-gradient(135deg, #1A252C 30%, #D85A30 90%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0px;
        padding-bottom: 0px;
    }
    
    .clara-subtitle {
        color: #657786;
        font-size: 1.15rem;
        margin-top: 5px;
        margin-bottom: 25px;
        font-weight: 400;
    }
    
    /* Rounded chat bubbles */
    div[data-testid="stChatMessage"] {
        border-radius: 16px !important;
        padding: 18px 24px !important;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02) !important;
        margin-bottom: 15px !important;
        border: 1px solid rgba(220, 224, 230, 0.5) !important;
    }
    
    /* Assistant bubble custom styling */
    div[data-testid="stChatMessage"][data-test-role="assistant"] {
        background-color: #FFFFFF !important;
    }
    
    /* User bubble custom styling */
    div[data-testid="stChatMessage"][data-test-role="user"] {
        background-color: #FFF5F2 !important;
        border: 1px solid rgba(216, 90, 48, 0.15) !important;
    }
    
    /* Sidebar Header styling */
    .sidebar-title {
        font-size: 2.4rem !important;
        font-weight: 800 !important;
        color: #D85A30 !important;
        margin-bottom: 0px;
    }
    
    .sidebar-subtitle {
        font-size: 0.9rem !important;
        color: #8899A6 !important;
        margin-top: -10px;
        margin-bottom: 20px;
        font-family: 'Inter', sans-serif;
    }
    
    /* Bold Sidebar section headers */
    .sidebar-section-header {
        font-size: 1.1rem;
        font-weight: 700;
        color: #1A252C;
        margin-top: 20px;
        margin-bottom: 10px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    /* Pill styling */
    .pill-badge {
        display: inline-block;
        padding: 6px 14px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 500;
        margin-right: 6px;
        margin-bottom: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
    
    .pill-coral {
        background-color: #D85A30;
        color: white;
        font-weight: 600;
    }
    
    .pill-gray {
        background-color: #F0F2F5;
        color: #4A5568;
        border: 1px solid #E2E8F0;
    }
    
    .pill-red {
        background-color: #FFF5F5;
        color: #C53030;
        border: 1px solid #FED7D7;
    }
</style>
""", unsafe_allow_html=True)

# Session state initialization
if "messages" not in st.session_state:
    st.session_state.messages = []
if "router" not in st.session_state:
    st.session_state.router = Router()
if "profile" not in st.session_state:
    st.session_state.profile = None

# --- SIDEBAR LAYOUT ---
with st.sidebar:
    # 1 & 2. Title & Subtitle
    st.markdown('<div class="sidebar-title">Clara ✨</div>', unsafe_allow_html=True)
    st.markdown('<div class="sidebar-subtitle">by Clinikally</div>', unsafe_allow_html=True)
    
    # 3. Divider
    st.markdown("---")
    
    # 4. Section: Agent Status
    st.markdown('<div class="sidebar-section-header">Agent Status</div>', unsafe_allow_html=True)
    
    state = st.session_state.router.state
    if state == "INTAKE":
        st.markdown("🟡 **Gathering your profile**")
    elif state == "RECOMMENDING":
        st.markdown("🔵 **Finding products...**")
    elif state == "DONE":
        st.markdown("🟢 **Recommendations ready**")
    else:
        st.markdown(f"⚫ **Status: {state}**")
        
    # 5. Divider
    st.markdown("---")
    
    # 6. Section: Your Skin Profile
    st.markdown('<div class="sidebar-section-header">Your Skin Profile</div>', unsafe_allow_html=True)
    
    profile = st.session_state.profile
    if profile is not None:
        # Show skin type as coral pill
        st.markdown("**Skin Type:**")
        skin_type = profile.get("skin_type", "all skin types")
        st.markdown(
            f'<span class="pill-badge pill-coral">{skin_type.capitalize()}</span>', 
            unsafe_allow_html=True
        )
        
        # Show concerns as small gray pills
        concerns = profile.get("concerns", [])
        if concerns:
            st.markdown("**Concerns:**")
            concerns_html = " ".join([
                f'<span class="pill-badge pill-gray">{c.capitalize()}</span>' 
                for c in concerns if c
            ])
            st.markdown(concerns_html, unsafe_allow_html=True)
            
        # Show sensitivities if present and not empty
        sensitivities = profile.get("sensitivities", [])
        # filter out empty strings/None or generic "none" elements
        valid_sens = [s for s in sensitivities if s and s.lower() != "none"]
        if valid_sens:
            st.markdown("**Sensitivities:**")
            sens_html = " ".join([
                f'<span class="pill-badge pill-red">{s.capitalize()}</span>' 
                for s in valid_sens
            ])
            st.markdown(sens_html, unsafe_allow_html=True)
            
        # Show age range as plain text
        age_range = profile.get("age_range")
        if age_range:
            st.markdown(f"**Age Range:** {age_range}")
    else:
        st.markdown("*Profile will appear after you describe your skin*")
        
    # 7. Divider
    st.markdown("---")
    
    # 8. Bottom label
    st.markdown('<div style="font-size: 0.8rem; color: #8899A6; text-align: center; margin-top: 50px;">Powered by Groq + Pinecone</div>', unsafe_allow_html=True)

# --- MAIN AREA LAYOUT ---
# 1. Header
st.markdown('<h1 class="clara-main-title">Clara — Your Personal Skin Assistant</h1>', unsafe_allow_html=True)

# 2. Subheader
st.markdown('<div class="clara-subtitle">Describe your skin and get personalized Clinikally recommendations</div>', unsafe_allow_html=True)

# 3. Divider
st.markdown("---")

# 4. Display all chat messages from session state
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# 6. If first load, show welcome message as a non-interactive bubble
if len(st.session_state.messages) == 0:
    welcome_text = "Hi! I'm Clara, your personal skincare assistant by Clinikally. Tell me about your skin type and concerns and I'll recommend the perfect products for you from our catalog."
    with st.chat_message("assistant"):
        st.markdown(welcome_text)

# 5. Chat input at bottom
prompt = st.chat_input("Tell me about your skin... (e.g. I have oily skin with acne)")

if prompt:
    # Append to messages immediately and display
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)
        
    # Run the router process with a spinner
    with st.spinner("Clara is thinking..."):
        result = st.session_state.router.process(prompt)
        
    # Append result and update profile
    st.session_state.messages.append({"role": "assistant", "content": result["response"]})
    
    if result["profile"] is not None:
        st.session_state.profile = result["profile"]
        
    with st.chat_message("assistant"):
        st.markdown(result["response"])
        
    # Trigger a rerun to refresh sidebar status and profile
    st.rerun()
