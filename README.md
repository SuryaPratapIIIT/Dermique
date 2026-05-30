# DermiQue 🌿✨

DermiQue is an intelligent, conversational AI skincare assistant that provides highly personalized product recommendations based on a user's unique skin profile, concerns, and goals.

## 🚀 Features

- **Conversational Intake:** A friendly AI agent guides users through a natural conversation to understand their skin type, specific concerns (e.g., acne, dryness, aging), and current routine.
- **Dynamic Skin Profiling:** Automatically extracts and builds a structured skin profile from the conversation history in real-time.
- **Smart Recommendations:** Uses Retrieval-Augmented Generation (RAG) with Pinecone vector database to find the perfect skincare products matching the user's exact needs.
- **Explainable AI:** Provides clear, tailored explanations for *why* a product was recommended and highlights the key active ingredients.
- **Modern UI:** A beautiful, responsive, glassmorphic Next.js frontend with smooth animations and interactive product cards.

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS
- **Components:** React, Lucide Icons, Framer Motion (Animations)
- **Language:** TypeScript

### Backend & AI
- **API Framework:** FastAPI (Python)
- **AI Orchestration:** LangGraph & LangChain
- **LLM Provider:** Google Gemini / Anthropic Claude / OpenAI (Configurable)
- **Vector Database:** Pinecone (for semantic product search)
- **Observability:** Langfuse (for tracing agent conversations)

## 📦 Project Structure

```
DermiQue/
├── frontend/             # Next.js React frontend
│   ├── app/              # Next.js app directory (pages & layouts)
│   ├── components/       # Reusable UI components (ChatWindow, ProductCard, etc.)
│   └── types/            # TypeScript interfaces
├── backend/              # FastAPI server
│   └── main.py           # API endpoints
├── agents/               # LangGraph AI Agents
│   ├── router.py         # Main conversation router
│   ├── intake_agent.py   # Handles user profiling
│   └── recommender_agent.py # Handles RAG & product matching
└── utils/                # Helper utilities (Langfuse logger, etc.)
```

## 💻 Local Development Setup

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- Pinecone Account (for Vector DB)
- Langfuse Account (optional, for observability)

### 1. Clone the repository
```bash
git clone https://github.com/SuryaPratapIIIT/Dermique.git
cd Dermique
```

### 2. Backend Setup
Create a virtual environment and install dependencies:
```bash
python -m venv venv
# On Windows
venv\Scripts\activate
# On Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in the root directory and add your API keys:
```env
# AI Provider
GOOGLE_API_KEY=your_api_key_here

# Pinecone Vector DB
PINECONE_API_KEY=your_pinecone_key_here
PINECONE_INDEX_NAME=your_index_name

# Langfuse (Optional)
LANGFUSE_PUBLIC_KEY=your_langfuse_public
LANGFUSE_SECRET_KEY=your_langfuse_secret
LANGFUSE_HOST=https://cloud.langfuse.com
```

Start the FastAPI backend:
```bash
cd backend
uvicorn main:app --reload
```

### 3. Frontend Setup
Open a new terminal window, navigate to the frontend directory, and install dependencies:
```bash
cd frontend
npm install
```

Start the Next.js development server:
```bash
npm run dev
```

### 4. Open the App
Visit `http://localhost:3000` in your browser to start chatting with DermiQue!

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License
This project is licensed under the MIT License.
