// React frontend with full login, registration, task management, filtering, and toast notifications
import { useState, useEffect, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import { API_BASE } from "./config";
import { Toaster, toast } from "react-hot-toast";
import { differenceInDays, parseISO } from "date-fns";
import InputWithError from "./components/InputWithError";

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
  const [createErrors, setCreateErrors] = useState({
    title: "",
    description: "",
    due_date: "",
  });
  const [editErrors, setEditErrors] = useState({
    title: "",
    description: "",
    due_date: "",
  });
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });
  const [dueDate, setDueDate] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [editPriority, setEditPriority] = useState("medium");
  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [justAddedTaskId, setJustAddedTaskId] = useState(null);
  const [lastEditedId, setLastEditedId] = useState(null);
  const [wasCreateSubmitted, setWasCreateSubmitted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  const debounceTimeout = useRef(null);

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
    const errors = { title: "", description: "", due_date: "" };

    if (!title.trim()) errors.title = "Task title is required.";
    if (description.length > 300)
      errors.description = "Description must be under 300 characters.";
    if (dueDate && isNaN(Date.parse(dueDate)))
      errors.due_date = "Invalid date format.";

    setCreateErrors(errors);

    if (errors.title || errors.description || errors.due_date) {
      toast.error("Please correct the errors before submitting.");
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (token) {
      fetchTasks().finally(() => setIsFirstLoad(false));
    }
  }, [token]);

  const logout = () => {
    setToken("");
    localStorage.removeItem("token");
    setTasks([]);
    setLoggedInUser("");
    toast.success("Logged out");
    setSearchQuery("");
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
    const res = await fetch(`${API_BASE}/tasks/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setTasks(await res.json());
    }
  };

  const createTask = async () => {
    setWasCreateSubmitted(true);
    if (!validateTaskForm()) return;
    const res = await fetch(`${API_BASE}/tasks/`, {
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
        priority,
      }),
    });
    if (res.ok) {
      const newTask = await res.json();
      setJustAddedTaskId(newTask.id);
      setTasks((prev) => [...prev, newTask]);
      setTimeout(() => setJustAddedTaskId(null), 500);

      setTitle("");
      setDescription("");
      setDueDate("");
      setPriority("medium");
      setWasCreateSubmitted(false);
      setCreateErrors({ title: "", description: "", due_date: "" });
      toast.success("Task created");
    }
  };

  const deleteTask = async (id) => {
    setDeletingTaskId(id);
    await new Promise((r) => setTimeout(r, 300));
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      toast.success("Task deleted");
      setDeletingTaskId(null);
    }
  };

  const toggleTaskCompletion = async (id, completed) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
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
        priority: task.priority || "medium",
      }),
    });
    if (res.ok) {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !completed } : t))
      );
    }
  };

  const startEdit = (task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditDueDate(task.due_date ? task.due_date.split("T")[0] : "");
    setEditPriority(task.priority || "medium");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
    setEditDueDate("");
    setEditPriority("medium");
    setEditErrors({ title: "", description: "", due_date: "" });
  };

  const validateEditForm = () => {
    const errors = { title: "", description: "", due_date: "" };

    if (!editTitle.trim()) errors.title = "Task title is required.";
    if (editDescription.length > 300)
      errors.description = "Description must be under 300 characters.";
    if (editDueDate && isNaN(Date.parse(editDueDate)))
      errors.due_date = "Invalid date format.";

    setEditErrors(errors);

    if (errors.title || errors.description || errors.due_date) {
      toast.error("Please correct the errors before saving.");
      return false;
    }

    return true;
  };

  const saveEdit = async (id) => {
    if (!validateEditForm()) return;
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
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
        priority: editPriority,
      }),
    });
    if (res.ok) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                title: editTitle,
                description: editDescription,
                due_date: editDueDate || null,
                priority: editPriority,
              }
            : t
        )
      );
      setLastEditedId(id);
      setTimeout(() => setLastEditedId(null), 500);
      cancelEdit();
      toast.success("Task updated");
    }
  };

  const filteredTasks = tasks
    .filter((task) => {
      if (filter === "completed") return task.completed;
      if (filter === "active") return !task.completed;
      if (filter === "overdue") {
        if (!task.due_date || task.completed) return false;
        return differenceInDays(parseISO(task.due_date), new Date()) < 0;
      }
      return true;
    })
    .filter(
      (task) =>
        task.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(debouncedQuery.toLowerCase())
    );

  const getDueColor = (dueDate, completed) => {
    if (completed || !dueDate) return "";
    const days = differenceInDays(parseISO(dueDate), new Date());
    if (days < 0) return "bg-red-100 dark:bg-red-800";
    if (days <= 2) return "bg-yellow-100 dark:bg-yellow-800";
    return "bg-green-100 dark:bg-green-800";
  };

  useEffect(() => {
    clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
  }, [searchQuery]);

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

              <div className="flex flex-col md:flex-row gap-2 mb-2">
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
                <button
                  className="px-3 py-1 rounded bg-gray-200 text-black hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                  onClick={() => setFilter("overdue")}
                >
                  Overdue
                </button>
              </div>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="🔍 Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-2 border rounded bg-white dark:bg-gray-800 text-black dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div className="flex flex-col gap-2 mb-4">
                <div className="flex flex-col md:flex-row gap-2">
                  <InputWithError
                    placeholder="Task title"
                    className="h-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400
 border px-12 rounded bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    error={wasCreateSubmitted ? createErrors.title : ""}
                  />

                  <InputWithError
                    type="date"
                    className="h-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400
 border px-12 rounded bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    error={wasCreateSubmitted ? createErrors.due_date : ""}
                  />

                  <select
                    className="h-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400
 border px-10 rounded bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
                    onChange={(e) => setPriority(e.target.value)}
                    value={priority}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <InputWithError
                  as="textarea"
                  rows={3}
                  placeholder="Description"
                  className="focus:outline-none focus:ring-2 focus:ring-blue-400
 resize-y w-full border px-3 py-2 rounded bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  error={wasCreateSubmitted ? createErrors.description : ""}
                />

                <button
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition"
                  onClick={createTask}
                >
                  Add
                </button>
              </div>

              <div className="space-y-2">
                {filteredTasks.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No tasks found.
                  </p>
                ) : isFirstLoad ? (
                  <p>Loading...</p>
                ) : (
                  filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`border p-4 rounded transition-all duration-500 ease-in-out flex flex-col md:flex-row justify-between items-start
						${getDueColor(task.due_date, task.completed)}
						${task.completed ? "opacity-50" : "opacity-100"}
						${deletingTaskId === task.id ? "opacity-0 scale-95" : ""}
						${lastEditedId === task.id ? "ring-2 ring-green-400" : ""}
						${justAddedTaskId === task.id ? "opacity-0 translate-y-3 animate-fade-in" : ""}
						`}
                    >
                      <div className="relative w-full">
                        {editingId === task.id ? (
                          <div className="flex flex-col gap-2 pr-12">
                            <div className="flex flex-col md:flex-row gap-2">
                              <InputWithError
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                placeholder="Task title"
                                error={editErrors.title}
                                className=" border px-10 h-10 text-sm rounded bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
                              />
                              <InputWithError
                                type="date"
                                value={editDueDate}
                                onChange={(e) => setEditDueDate(e.target.value)}
                                error={editErrors.due_date}
                                className=" border px-10 h-10 text-sm rounded bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
                              />

                              <select
                                value={editPriority}
                                onChange={(e) =>
                                  setEditPriority(e.target.value)
                                }
                                className=" border px-4 h-10 text-sm rounded bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
                              >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                              </select>
                              <button
                                onClick={() => deleteTask(task.id)}
                                className=" absolute right-0 bg-white text-black rounded-full p-2 shadow hover:scale-105 transition"
                              >
                                🗑️
                              </button>
                            </div>

                            <InputWithError
                              as="textarea"
                              rows={3}
                              value={editDescription}
                              onChange={(e) =>
                                setEditDescription(e.target.value)
                              }
                              placeholder="Description"
                              error={editErrors.description}
                              className="resize-y w-full border px-3 py-2 rounded bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
                            />

                            <div className="flex gap-2 sm:col-span-2">
                              <button
                                className="inline-flex items-center gap-1 text-sm font-medium px-3 py-1 rounded transition 
									bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 
									text-green-700 dark:text-green-400"
                                onClick={() => saveEdit(task.id)}
                              >
                                <span className="text-lg">💾</span>
                                <span>Save</span>
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="flex items-center gap-2 text-red-500 px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                              >
                                ❌ Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => startEdit(task)}
                            className="cursor-pointer space-y-1"
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
                                📅 Due date:{" "}
                                {new Date(task.due_date).toLocaleDateString()}
                              </p>
                            )}
                            {task.priority && (
                              <span
                                className={`text-xs font-semibold px-2 py-1 rounded-full
								${
                  task.priority === "high"
                    ? "bg-red-600 text-white"
                    : task.priority === "medium"
                    ? "bg-yellow-300 text-black"
                    : "bg-green-500 text-white"
                } shadow-sm`}
                              >
                                {task.priority.toUpperCase()}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="absolute bottom-4 right-4 flex items-center gap-2 mt-2">
                          <input
                            id={`completed-${task.id}`}
                            type="checkbox"
                            checked={task.completed}
                            onChange={() =>
                              toggleTaskCompletion(task.id, task.completed)
                            }
                            className="w-4 h-4 accent-green-600"
                          />
                          <label
                            htmlFor={`completed-${task.id}`}
                            className="text-sm select-none"
                          >
                            Completed
                          </label>
                        </div>
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
