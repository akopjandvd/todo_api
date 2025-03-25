# 📜 TODO App (Full-stack Demo)

This is a full-stack TODO application with user authentication, task management, filtering, and a responsive UI. It includes both a **FastAPI backend** and a **React + Tailwind frontend**.

---

## 🚀 Features

### 🔐 Authentication
- User registration
- Secure login with JWT tokens
- Password strength validation
- Brute-force protection (rate limiting by IP)

### ✅ Task Management
- Add, edit, delete tasks
- Mark tasks as completed
- Task filtering (All / Active / Completed)

### 🌗 Theme
- Dark/Light mode toggle (persists while logged in)

### ⚙️ Additional
- Toast notifications for key actions
- Form validations (e.g., empty title, max description length)
- Fully responsive layout

---

## 📦 Tech Stack

### Backend
- Python, FastAPI
- SQLite with SQLAlchemy ORM
- JWT for auth
- SlowAPI for rate limiting

### Frontend
- React with Vite
- TailwindCSS for styling
- Toast system for feedback

---

## 🧪 Running Locally

### 1. Backend (FastAPI)
```bash
cd todo_api
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate (on Windows)
pip install -r requirements.txt
uvicorn main:app --reload
```

### 2. Frontend (React + Tailwind)
```bash
cd todo-frontend
npm install
npm run dev
```

> Visit `http://localhost:5173` to use the app

---

## 🛡️ Brute-force Protection

- Max 5 login attempts per minute per **IP address**
- If exceeded: returns HTTP 429 Too Many Requests

---

## 🗂️ Folder Structure
```
todo_api/
│   main.py
│   auth.py
│   models.py
│   database.py
│   ...
│
├── routes/
│   └── auth.py
│   └── tasks.py
│
└── todo-frontend/
    └── src/App.jsx
    └── ...
```

---

## 📸 Screenshots
TBD
---

## 🌍 Demo Deployment
- Backend: Render.com
- Frontend: Vercel.com

