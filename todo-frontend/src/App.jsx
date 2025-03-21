// React frontend with login, token storage, and auto logout
import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

export default function TodoApp() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) setToken(storedToken);
  }, []);

  useEffect(() => {
    if (!token) return;

    try {
      const decoded = jwtDecode(token);
      const exp = decoded.exp;
      const now = Date.now() / 1000;

      if (exp < now) {
        logout();
      } else {
        const timeout = setTimeout(() => logout(), (exp - now) * 1000);
        return () => clearTimeout(timeout);
      }
    } catch (e) {
      logout();
    }
  }, [token]);

  const logout = () => {
    setToken("");
    localStorage.removeItem("token");
    setTasks([]);
  };

  const login = async () => {
    const res = await fetch("http://localhost:8000/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      const data = await res.json();
      setToken(data.access_token);
      localStorage.setItem("token", data.access_token);
    } else {
      alert("Login failed");
    }
  };

  const fetchTasks = async () => {
    const res = await fetch("http://localhost:8000/tasks/", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    setTasks(data);
  };

  const createTask = async () => {
    await fetch("http://localhost:8000/tasks/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title,
        description,
        completed: false,
      }),
    });
    setTitle("");
    setDescription("");
    fetchTasks();
  };

  useEffect(() => {
    if (token) fetchTasks();
  }, [token]);

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">📝 TODO App</h1>

      {!token ? (
        <div className="space-y-2 mb-4">
          <input
            placeholder="Username"
            className="border p-2 w-full"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            placeholder="Password"
            type="password"
            className="border p-2 w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded"
            onClick={login}
          >
            Login
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={logout}
            className="text-red-500 underline mb-4"
          >
            Logout
          </button>

          <div className="flex gap-2 mb-4">
            <input
              placeholder="Task title"
              className="border p-2 flex-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              placeholder="Description"
              className="border p-2 flex-1"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <button
              className="bg-green-500 text-white px-4 py-2 rounded"
              onClick={createTask}
            >
              Add
            </button>
          </div>

          <div className="space-y-2">
            {tasks.map((task) => (
              <div key={task.id} className="border p-4 rounded">
                <h2 className="text-lg font-semibold">{task.title}</h2>
                <p className="text-sm text-gray-600">{task.description}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}