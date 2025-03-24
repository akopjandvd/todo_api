# 📝 TODO App – Fullstack Demo Project

This project is a full-featured TODO app where users can register, log in, and manage their personal tasks.

> 🔐 JWT-based authentication  
> 📋 Task CRUD (Create, Read, Update, Delete)  
> 🎯 Task filtering and completion  
> 💅 Responsive Tailwind UI  

---

## 🚀 Features

- User registration & login
- JWT-based authentication
- Add, list, update, delete tasks
- Filter by: **All / Active / Completed**
- Responsive frontend using Tailwind CSS
- Token expiry handling with auto logout

---

## 🧰 Tech Stack

| Frontend        | Backend   | Other         |
|------------------|------------|----------------|
| React (with Vite) | FastAPI    | JWT Auth       |
| Tailwind CSS     | Python 3   | SQLite         |
| JSX              | Uvicorn    | LocalStorage   |

---

## 📦 Installation

### 🔧 1. Clone the repository

- git clone https://github.com/yourusername/todo_api.git
- cd todo_api

### 🔧 2. Backend setup (FastAPI)
- cd todo-backend
- python -m venv venv
- venv\Scripts\activate       # or source venv/bin/activate on Linux/macOS
- pip install -r requirements.txt
- uvicorn main:app --reload

### 🔧 3. Frontend setup (React + Vite + Tailwind)
- cd todo-frontend
- npm install
- npm run dev

Then visit: http://localhost:5173



