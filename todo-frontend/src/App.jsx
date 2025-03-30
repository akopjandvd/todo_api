// React frontend with full login, registration, task management, filtering, and toast notifications
import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { API_BASE } from "./config";
import { Toaster, toast } from "react-hot-toast";
import { differenceInDays, parseISO } from "date-fns";

export default function TodoApp() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState("");
  const [loggedInUser, setLoggedInUser] = useState("");
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [filter, setFilter] = useState("all");
  const [errorMessage, setErrorMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({
    title: "",
    description: "",
    due_date: "",
  });
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });
  const [dueDate, setDueDate] = useState("");
  const [editDueDate, setEditDueDate] = useState("");

  useEffect(() => {
    darkMode
      ? document.documentElement.classList.add("dark")
      : document.documentElement.classList.remove("dark");
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

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
      setLoggedInUser(decoded.sub || "");
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

  const validateTaskForm = () => {
    const errors = { title: "", description: "" };
    if (!title.trim()) errors.title = "Task title is required.";
    if (description.length > 300)
      errors.description = "Description must be under 300 characters.";
    setFormErrors(errors);
    if (errors.title || errors.description) {
      toast.error(Object.values(errors).filter(Boolean).join(" "));
    }
    return !errors.title && !errors.description;
  };

  useEffect(() => {
    if (token) fetchTasks();
  }, [token]);

  const logout = () => {
    setToken("");
    localStorage.removeItem("token");
    setTasks([]);
    setLoggedInUser("");
    toast.success("Logged out");
  };

  const validatePassword = (password) => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^A-Za-z0-9]/.test(password)
    );
  };

  const register = async () => {
    setErrorMessage("");
    if (!username || !password) {
      setErrorMessage("Username and password cannot be empty.");
      return;
    }
    if (!validatePassword(password)) {
      setErrorMessage(
        "Password must be at least 8 characters long and include uppercase, lowercase, a number, and a special character."
      );
      return;
    }
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    res.ok
      ? (toast.success("Registration successful"), setIsRegistering(false))
      : toast.error("Registration failed");
  };

  const login = async () => {
    setErrorMessage("");
    if (!username || !password) {
      setErrorMessage("Username and password cannot be empty.");
      return;
    }
    const res = await fetch(`${API_BASE}/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      const data = await res.json();
      setToken(data.access_token);
      localStorage.setItem("token", data.access_token);
      toast.success("Login successful");
    } else {
      toast.error("Login failed");
    }
  };

  const fetchTasks = async () => {
    setIsLoading(true);
    const res = await fetch(`${API_BASE}/tasks/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setTasks(await res.json());
    }
    setIsLoading(false);
  };

  const createTask = async () => {
    if (!validateTaskForm()) return;
    setIsLoading(true);
    await fetch(`${API_BASE}/tasks/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title,
        description,
        due_date: dueDate || null,
        completed: false,
      }),
    });
    setTitle("");
    setDescription("");
    setDueDate("");

    setFormErrors({ title: "", description: "", due_date: "" });
    await fetchTasks();
    setIsLoading(false);
    toast.success("Task created");
  };

  const deleteTask = async (id) => {
    await fetch(`${API_BASE}/tasks/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchTasks();
    toast.success("Task deleted");
  };

  const toggleTaskCompletion = async (id, completed) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    await fetch(`${API_BASE}/tasks/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: task.title,
        description: task.description,
        due_date: task.due_date || null,
        completed: !completed,
      }),
    });
    fetchTasks();
  };

  const startEdit = (task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditDueDate(task.due_date ? task.due_date.split("T")[0] : "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
  };

  const saveEdit = async (id) => {
    await fetch(`${API_BASE}/tasks/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: editTitle,
        description: editDescription,
        due_date: editDueDate || null,
        completed: tasks.find((t) => t.id === id)?.completed || false,
      }),
    });
    cancelEdit();
    fetchTasks();
    toast.success("Task updated");
  };

  const filteredTasks = tasks.filter((task) =>
    filter === "completed"
      ? task.completed
      : filter === "active"
      ? !task.completed
      : true
  );

  const getDueColor = (dueDate) => {
    if (!dueDate) return "";
    const days = differenceInDays(parseISO(dueDate), new Date());
    if (days < 0) return "bg-red-100 dark:bg-red-800";
    if (days <= 2) return "bg-yellow-100 dark:bg-yellow-800";
    return "bg-green-100 dark:bg-green-800";
  };

  return (
    <div className={`${darkMode ? "dark" : ""}`}>
      <Toaster position="top-right" />
      <div className="w-screen min-h-screen bg-white dark:bg-gray-900 text-black dark:text-white transition-colors flex justify-center items-start">
        <div className="w-full max-w-2xl px-4 py-8">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="text-sm underline text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              {darkMode ? "☀️ Light mode" : "🌙 Dark mode"}
            </button>
          </div>
          {loggedInUser && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              👋 Hello, <span className="font-semibold">{loggedInUser}</span>
            </p>
          )}

          <h1 className="text-2xl font-bold mb-4">📝 TODO App</h1>

          {!token ? (
            <div className="space-y-2 mb-4">
              <input
                placeholder="Username"
                className="border border-gray-300 dark:border-gray-600 p-2 w-full bg-white dark:bg-gray-800 text-black dark:text-white"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <div className="relative">
                <input
                  placeholder="Password"
                  type={showPassword ? "text" : "password"}
                  className="border border-gray-300 dark:border-gray-600 p-2 w-full bg-white dark:bg-gray-800 text-black dark:text-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-3 py-2 text-sm text-gray-600 dark:text-gray-300"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errorMessage && (
                <p className="text-red-500 text-sm">{errorMessage}</p>
              )}
              {!isRegistering ? (
                <div className="flex gap-2">
                  <button
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                    onClick={login}
                  >
                    Login
                  </button>
                  <button
                    className="bg-gray-500 text-white px-4 py-2 rounded"
                    onClick={() => setIsRegistering(true)}
                  >
                    Register
                  </button>
                </div>
              ) : (
                <>
                  <button
                    className="bg-green-600 text-white px-4 py-2 rounded w-full"
                    onClick={register}
                  >
                    Confirm Registration
                  </button>
                  <button
                    className="text-blue-500 underline text-sm mt-2"
                    onClick={() => setIsRegistering(false)}
                  >
                    Back to login
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={logout}
                className="text-sm px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition"
              >
                Logout
              </button>

              <div className="flex flex-col sm:flex-row gap-2 mb-2">
                <button
                  className="px-3 py-1 rounded bg-gray-200 text-black hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                  onClick={() => setFilter("all")}
                >
                  All
                </button>
                <button
                  className="px-3 py-1 rounded bg-gray-200 text-black hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                  onClick={() => setFilter("active")}
                >
                  Active
                </button>
                <button
                  className="px-3 py-1 rounded bg-gray-200 text-black hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                  onClick={() => setFilter("completed")}
                >
                  Completed
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <input
                  placeholder="Task title"
                  className="border p-2 flex-1 w-full bg-white text-black dark:bg-gray-800 dark:text-white dark:border-gray-600"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <input
                  placeholder="Description"
                  className="border p-2 flex-1 w-full bg-white text-black dark:bg-gray-800 dark:text-white dark:border-gray-600"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <input
                  type="date"
                  className="border p-2 flex-1 w-full bg-white text-black dark:bg-gray-800 dark:text-white dark:border-gray-600"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />

                <button
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded w-full sm:w-auto transition"
                  onClick={createTask}
                >
                  Add
                </button>
              </div>

              <div className="space-y-2">
                {isLoading ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Loading...
                  </p>
                ) : (
                  filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`border border-gray-300 dark:border-gray-600 p-4 rounded flex flex-col sm:flex-row justify-between items-start ${getDueColor(
                        task.due_date
                      )}`}
                    >
                      <div className="flex gap-2 items-start w-full justify-between">
                        <div className="flex gap-2">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() =>
                              toggleTaskCompletion(task.id, task.completed)
                            }
                          />
                          {editingId === task.id ? (
                            <div className="flex flex-col gap-2">
                              <input
                                className="border p-2 w-full bg-white text-black dark:bg-gray-800 dark:text-white dark:border-gray-600"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                              />
                              <input
                                className="border p-2 w-full bg-white text-black dark:bg-gray-800 dark:text-white dark:border-gray-600"
                                value={editDescription}
                                onChange={(e) =>
                                  setEditDescription(e.target.value)
                                }
                              />
                              <input
                                type="date"
                                className="border p-2 w-full bg-white text-black dark:bg-gray-800 dark:text-white dark:border-gray-600"
                                value={editDueDate}
                                onChange={(e) => setEditDueDate(e.target.value)}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => saveEdit(task.id)}
                                  className="text-green-600 px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                                >
                                  💾 Save
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="text-gray-500 dark:text-gray-400 px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                                >
                                  ❌ Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={() => startEdit(task)}
                              className="cursor-pointer"
                            >
                              <h2
                                className={`text-lg font-semibold ${
                                  task.completed
                                    ? "line-through text-gray-400"
                                    : "text-black dark:text-white"
                                }`}
                              >
                                {task.title}
                              </h2>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {task.description}
                              </p>
                              {task.due_date && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  📅 Határidő:{" "}
                                  {new Date(task.due_date).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="text-red-500 text-sm"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
