# 📜 TODO App (Full-stack Demo)

A complete full-stack TODO application with modern technologies, user authentication, task management, reminders, tagging, pinning, and a clean, responsive UI. Built with a FastAPI backend and a React + TailwindCSS frontend.

---

## 🚀 Features

### 🔐 Authentication
- User registration and secure login with JWT tokens
- Password strength validation (uppercase, lowercase, number, special character)
- Brute-force protection (rate limiting by IP)

### ✅ Task Management
- Create, edit, delete tasks
- Mark tasks as completed
- **Priority levels**: low / medium / high
- **Due date** support
- **Tags** support (e.g., `🏷️ frontend, bugfix`)
- **Pinning** – sticky important tasks to the top

### 🔍 Search & Filtering
- Filters: All / Active / Completed / Overdue
- Real-time search on title and description (with debounce)
- Sorting: By title, due date, or priority (ascending/descending)

### 🌗 Theme
- Light / Dark mode toggle (stored in localStorage)

### 🔔 Notifications
- Toast notifications for successful or failed actions
- **Fixed reminder toast** – for tasks due soon
- Dismissible and managed toasts with priority display

### 📤 Export
- **CSV export** – Download your tasks for backup or analysis

### 📱 Responsiveness
- Mobile, tablet, and desktop optimized
- Clean and compact UI using TailwindCSS

---

## 🧰 Tech Stack

### Backend
- Python, FastAPI
- SQLite + SQLAlchemy ORM
- JWT (PyJWT)
- SlowAPI for rate limiting

### Frontend
- React + Vite
- TailwindCSS
- React Hot Toast (notifications)

---

## 🧪 Running Locally

CI keeps the `test` completion check on every main push and PR. A lightweight
scope job inspects the complete event diff before starting Postgres. Only changes
confined to `README.md` and `todo-frontend/README.md` use document consistency
checks; backend/frontend code, tests, dependency/configuration files, workflows,
unknown paths, renames or unavailable history retain the full backend test job.
The completion check fails for failed, cancelled or accidentally skipped required
work. Superseded ordinary runs are cancelled.
Manual workflow dispatch always runs full validation in a separate,
non-cancelling group. CI uses read-only repository permissions and checkout
does not persist credentials.

Scope and completion-gate regression tests run with
`python3 -B .github/scripts/test_ci_scope.py`. The endpoint ping workflow is
manual-only; it does not keep the external service awake on a schedule.

### 1. Backend (FastAPI)
```bash
cd todo_api
python -m venv venv
source venv/bin/activate  # or on Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### 2. Frontend (React + TailwindCSS)
```bash
cd todo-frontend
npm install
npm run dev
```

🔗 Visit: [http://localhost:5173](http://localhost:5173)

---

## 🛡️ Brute-force Protection
- Max 5 login attempts per minute per IP address
- Returns HTTP 429 (Too Many Requests) on limit

---

## 🗂️ Folder Structure

```
todo_api/
├── main.py
├── models.py
├── auth.py
├── database.py
├── routes/
│   ├── auth.py
│   └── tasks.py

todo-frontend/
└── src/
    ├── App.jsx
    ├── components/
    │   └── InputWithError.jsx
    └── ...
```

---

## 📸 Screenshots

_TBD_

---

## 🌍 Demo Deployment
- **Backend:** Render.com
- **Frontend:** Vercel.com
