// React frontend with full login, registration, task management, filtering, and toast notifications
import { useState, useEffect, useRef } from "react";
import { API_BASE } from "./config";
import { Toaster, toast } from "react-hot-toast";
import { differenceInDays, parseISO, isSameWeek, format } from "date-fns";
import InputWithError from "./components/InputWithError";
import StatSection from "./components/StatSection";
import WeeklyBarChart from "./components/WeeklyBarChart";
import PriorityPieChart from "./components/PriorityPieChart";
import PriorityBarChart from "./components/PriorityBarChart";
import WeeklyPieChart from "./components/WeeklyPieChart";
import {
  validateTaskFieldsAndSetErrors,
  isStrongPassword,
} from "./utils/validation";
import useTokenHandler from "./hooks/useTokenHandler";
import { exportTasksAsCSV } from "./utils/export";

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
  const [sortBy, setSortBy] = useState("priority");
  const [sortDirection, setSortDirection] = useState("asc"); // or "desc"
  const [tags, setTags] = useState("");
  const [editTags, setEditTags] = useState("");
  const [showStatsPanel, setShowStatsPanel] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [chartType, setChartType] = useState("bar");

  const filters = ["all", "active", "completed", "overdue"];
  const createFields = { title, description, dueDate, priority, tags };
  const editFields = {
    title: editTitle,
    description: editDescription,
    dueDate: editDueDate,
    priority: editPriority,
    tags: editTags,
  };

  const fetchTasks = async () => {
    const res = await fetch(`${API_BASE}/tasks/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setTasks(await res.json());
    }
  };

  function clearSession() {
    setToken("");
    localStorage.removeItem("token");
    setTasks([]);
    setLoggedInUser("");
    setSearchQuery("");
  }

  const logout = () => {
    clearSession();
    toast.success("Logged out");
  };

  useEffect(() => {
    darkMode
      ? document.documentElement.classList.add("dark")
      : document.documentElement.classList.remove("dark");
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      try {
        const decoded = jwtDecode(storedToken);
        const now = Date.now() / 1000;
        if (decoded.exp > now) {
          setToken(storedToken);
        } else {
          localStorage.removeItem("token"); 
        }
      } catch (e) {
        localStorage.removeItem("token"); 
      }
    }
  }, []);
  

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

  useTokenHandler(token, setToken, setLoggedInUser, logout);

  const checkUpcomingTasks = (taskList) => {
    const now = new Date();
    const upcoming = taskList.filter((task) => {
      if (!task.due_date || task.completed) return false;
      const diffInDays =
        (new Date(task.due_date) - now) / (1000 * 60 * 60 * 24);
      return diffInDays >= -1 && diffInDays <= 2;
    });

    if (upcoming.length > 0) {
      toast.custom(
        (t) => (
          <div className="fixed z-40 w-full sm:max-w-sm px-4 sm:px-0 sm:left-4 sm:top-4 sm:ml-4 top-4 left-1/2 transform -translate-x-1/2 sm:translate-x-0 animate-slide-fade-in">
            <div className="relative bg-yellow-100 dark:bg-yellow-800 text-black dark:text-white p-4 rounded shadow-md flex justify-between items-start gap-4 transition-all">
              <div className="flex-1">
                <strong className="block text-sm font-semibold mb-1">
                  ⏰ Upcoming tasks
                </strong>
                <p className="text-sm mb-1">
                  You have {upcoming.length} task(s) due soon:
                </p>
                <ul className="text-sm list-disc list-inside">
                  {upcoming.slice(0, 5).map((task) => (
                    <li key={task.id} className="truncate">
                      {task.title}
                    </li>
                  ))}
                </ul>
                {upcoming.length > 5 && (
                  <p className="text-xs italic text-gray-600 dark:text-gray-300 mt-1">
                    ...and {upcoming.length - 5} more
                  </p>
                )}
              </div>
              <button
                onClick={() => toast.dismiss("reminder-toast")}
                className="absolute top-2 right-2 text-sm rounded-full bg-gray-200 dark:bg-gray-900 text-gray-800 dark:text-white hover:text-red-600 transition"
              >
                ✖
              </button>
            </div>
          </div>
        ),
        {
          id: "reminder-toast",
          duration: Infinity,
        }
      );
    } else {
      toast.dismiss("reminder-toast");
    }
  };

  useEffect(() => {
    checkUpcomingTasks(tasks);
  }, [tasks]);

  const register = async () => {
    setErrorMessage("");
    if (!username || !password) {
      setErrorMessage("Username and password cannot be empty.");
      return;
    }
    if (!isStrongPassword(password)) {
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

  const validateTaskForm = () =>
    validateTaskFieldsAndSetErrors(
      createFields,
      setCreateErrors,
      "Please correct the errors before submitting."
    );

  const validateEditForm = () =>
    validateTaskFieldsAndSetErrors(
      editFields,
      setEditErrors,
      "Please correct the errors before saving."
    );

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
        tags: tags,
      }),
    });
    if (res.ok) {
      const newTask = await res.json();
      const updated = [...tasks, newTask];
      setTasks(updated);
      setJustAddedTaskId(newTask.id);
      setTimeout(() => setJustAddedTaskId(null), 500);

      setTitle("");
      setDescription("");
      setDueDate("");
      setPriority("medium");
      setWasCreateSubmitted(false);
      setCreateErrors({ title: "", description: "", due_date: "" });
      setTags("");
      toast.success("Task created");
      checkUpcomingTasks(updated);
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
      const updated = tasks.filter((t) => t.id !== id);
      setTasks(updated);
      setDeletingTaskId(null);
      toast.success("Task deleted");
      checkUpcomingTasks(updated);
    }
  };

  const toggleTaskCompletion = async (id, completed) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const updatedTask = {
      ...task,
      completed: !completed,
    };

    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updatedTask),
    });

    if (res.ok) {
      const updatedTasks = tasks.map((t) => (t.id === id ? updatedTask : t));
      setTasks(updatedTasks);
      checkUpcomingTasks(updatedTasks); // ⏰ ha ez egy lejáró task volt, frissítjük
    }
  };

  const startEdit = (task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditDueDate(task.due_date ? task.due_date.split("T")[0] : "");
    setEditPriority(task.priority || "medium");
    setEditTags(task.tags || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
    setEditDueDate("");
    setEditPriority("medium");
    setEditErrors({ title: "", description: "", due_date: "" });
  };

  const saveEdit = async (id) => {
    if (!validateEditForm()) return;

    const taskToUpdate = tasks.find((t) => t.id === id);
    if (!taskToUpdate) return;

    const updatedTask = {
      ...taskToUpdate,
      title: editTitle,
      description: editDescription,
      due_date: editDueDate || null,
      completed: taskToUpdate.completed,
      priority: editPriority,
      tags: editTags,
    };

    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updatedTask),
    });

    if (res.ok) {
      const updatedTasks = tasks.map((t) => (t.id === id ? updatedTask : t));
      setTasks(updatedTasks);
      setLastEditedId(id);
      setTimeout(() => setLastEditedId(null), 500);
      cancelEdit();
      toast.success("Task updated");
      checkUpcomingTasks(updatedTasks); // 👈
    }
  };

  const togglePinTask = async (id) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const updatedTask = {
      ...task,
      pinned: !task.pinned,
    };

    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updatedTask),
    });

    if (res.ok) {
      const updatedTasks = tasks.map((t) => (t.id === id ? updatedTask : t));
      setTasks(updatedTasks);
      checkUpcomingTasks(updatedTasks);
      toast.success(updatedTask.pinned ? "Task pinned" : "Task unpinned");
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

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;

    let result = 0;

    if (sortBy === "title") {
      result = a.title.localeCompare(b.title);
    } else if (sortBy === "due_date") {
      result = new Date(a.due_date || 0) - new Date(b.due_date || 0);
    } else if (sortBy === "priority") {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      result =
        (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99);
    }

    return sortDirection === "asc" ? result : -result;
  });

  const handleExportClick = () => {
    const csvContent = exportTasksAsCSV(tasks);
    if (!csvContent) {
      return;
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "tasks.csv");
    link.click();
  };

  const openStatsPanel = () => {
    setIsAnimatingOut(false);
    setShowStatsPanel(true);
  };

  const closeStatsPanel = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setShowStatsPanel(false);
      setIsAnimatingOut(false);
    }, 300);
  };

  function getPriorityStats(tasks) {
    const counts = { low: 0, medium: 0, high: 0 };

    for (const task of tasks) {
      if (task.priority && counts[task.priority] !== undefined) {
        counts[task.priority]++;
      }
    }

    return [
      { name: "Low", value: counts.low },
      { name: "Medium", value: counts.medium },
      { name: "High", value: counts.high },
    ];
  }

  const priorityData = getPriorityStats(tasks);

  const getWeeklyDueStats = (tasks) => {
    const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const counts = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };

    tasks.forEach((task) => {
      if (!task.due_date || task.completed) return;

      const date = parseISO(task.due_date);
      if (isSameWeek(date, new Date(), { weekStartsOn: 1 })) {
        const day = format(date, "EEE");
        if (counts[day] !== undefined) {
          counts[day]++;
        }
      }
    });

    return weekDays.map((day) => counts[day]);
  };

  const weeklyData = getWeeklyDueStats(tasks);

  useEffect(() => {
    if (showStatsPanel) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [showStatsPanel]);

  useEffect(() => {
    if (token) {
      fetchTasks().finally(() => setIsFirstLoad(false));
    }
  }, [token]);

  return (
    <div className={`${darkMode ? "dark" : ""}`}>
      <Toaster
        toastOptions={{
          duration: 3000,
          className:
            "!top-4 sm:!top-4 sm:!right-4 sm:!left-auto !left-1/2 !-translate-x-1/2",
        }}
      />{" "}
      <div className="w-screen min-h-screen bg-white dark:bg-gray-900 text-black dark:text-white transition-colors flex justify-center items-start">
        <div className="w-full max-w-2xl px-4 py-8">
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
              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={logout}
                  className="text-sm px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition"
                >
                  Logout
                </button>

                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="text-sm px-3 py-1 rounded bg-gray-200 text-black hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition"
                >
                  {darkMode ? "☀️ Light mode" : "🌙 Dark mode"}
                </button>
              </div>

              <div className="mb-4">
                <input
                  id="search-task"
                  type="text"
                  placeholder="🔍 Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-2 border rounded bg-white dark:bg-gray-800 text-black dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <InputWithError
                id="task-title"
                placeholder="Task title"
                className="h-10 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400
                    border px-4 rounded bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                error={wasCreateSubmitted ? createErrors.title : ""}
              />
              <div className="flex flex-col  gap-2 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <label
                    className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap"
                    htmlFor="due-date-input"
                  >
                    Due date:
                  </label>

                  <InputWithError
                    id="due-date-input"
                    type="date"
                    className="h-10 w-full sm:w-auto text-sm focus:outline-none focus:ring-2 focus:ring-blue-400
                    border px-4 rounded bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    error={wasCreateSubmitted ? createErrors.due_date : ""}
                  />

                  <label
                    className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap"
                    htmlFor="priority-input"
                  >
                    Priority:
                  </label>

                  <select
                    id="priority-input"
                    className="h-10 w-full sm:w-auto text-sm focus:outline-none focus:ring-2 focus:ring-blue-400
                    border px-4 rounded bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
                    onChange={(e) => setPriority(e.target.value)}
                    value={priority}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <InputWithError
                  id="create-description"
                  as="textarea"
                  rows={3}
                  placeholder="Description"
                  className="focus:outline-none focus:ring-2 focus:ring-blue-400
                  resize-y w-full border px-4 py-2 rounded bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  error={wasCreateSubmitted ? createErrors.description : ""}
                />

                <input
                  id="create-tags"
                  placeholder="Tags (comma separated)"
                  className="border px-4 py-2 bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600 w-full"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />

                <button
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition"
                  onClick={createTask}
                >
                  Add
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="sort-by"
                      className="text-sm text-gray-700 dark:text-gray-300"
                    >
                      Sort by:
                    </label>
                    <select
                      id="sort-by"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="p-2 border rounded bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
                    >
                      <option value="title">Title (A-Z)</option>
                      <option value="due_date">Due date</option>
                      <option value="priority">Priority</option>
                    </select>
                  </div>

                  <select
                    id="sort-direction"
                    value={sortDirection}
                    onChange={(e) => setSortDirection(e.target.value)}
                    className="p-2 border rounded bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
                  >
                    <option value="asc">⬆️ Ascending</option>
                    <option value="desc">⬇️ Descending</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleExportClick}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm w-full sm:w-auto"
                  >
                    📥 Export tasks as CSV
                  </button>
                  <button
                    onClick={openStatsPanel}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm"
                  >
                    📊 Stats
                  </button>
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-2 mb-2">
                {filters.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 rounded ${
                      filter === f
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-black dark:text-white"
                    }`}
                  >
                    {f[0].toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                {filteredTasks.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No tasks found.
                  </p>
                ) : isFirstLoad ? (
                  <p>Loading...</p>
                ) : (
                  sortedTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`border p-4 rounded transition-all duration-500 ease-in-out flex flex-col md:flex-row justify-between items-start
                      ${getDueColor(task.due_date, task.completed)}
                      ${task.completed ? "opacity-50" : "opacity-100"}
                      ${deletingTaskId === task.id ? "opacity-0 scale-95" : ""}
                      ${lastEditedId === task.id ? "ring-2 ring-green-400" : ""}
                      ${
                        justAddedTaskId === task.id
                          ? "opacity-0 translate-y-3 animate-fade-in"
                          : ""
                      }
                      ${task.pinned ? "ring-2 ring-indigo-400" : ""}
                      `}
                    >
                      <div className="relative w-full min-h-[130px]">
                        {editingId === task.id ? (
                          <div className="flex flex-col gap-2 pr-12">
                            <div className="flex flex-col md:flex-row gap-2 items-center">
                              {/* Title input */}
                              <InputWithError
                                id="edit-title"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                placeholder="Task title"
                                error={editErrors.title}
                                className="h-10 w-full sm:w-auto text-sm focus:outline-none focus:ring-2 focus:ring-blue-400
                                border px-4 rounded bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
                              />

                              {/* Due date label + input */}
                              <div className="flex items-center gap-1">
                                <label
                                  htmlFor="due-date-edit"
                                  className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap"
                                >
                                  Due date:
                                </label>
                                <InputWithError
                                  id="due-date-edit"
                                  type="date"
                                  value={editDueDate}
                                  onChange={(e) =>
                                    setEditDueDate(e.target.value)
                                  }
                                  error={editErrors.due_date}
                                  className="h-10 w-full sm:w-auto text-sm focus:outline-none focus:ring-2 focus:ring-blue-400
                                  border px-4 rounded bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
                                />
                              </div>

                              {/* Priority select */}
                              <select
                                id="edit-priority"
                                value={editPriority}
                                onChange={(e) =>
                                  setEditPriority(e.target.value)
                                }
                                className="h-10 w-full sm:w-auto text-sm focus:outline-none focus:ring-2 focus:ring-blue-400
                                border px-4 rounded bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
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
                              id="edit-description"
                              as="textarea"
                              rows={3}
                              value={editDescription}
                              onChange={(e) =>
                                setEditDescription(e.target.value)
                              }
                              placeholder="Description"
                              error={editErrors.description}
                              className="focus:outline-none focus:ring-2 focus:ring-blue-400
                              resize-y w-full border px-4 py-2 rounded bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
                            />
                            <input
                              id="edit-tags"
                              placeholder="Tags (comma separated)"
                              className="border px-4 py-2 bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600 w-full"
                              value={editTags}
                              onChange={(e) => setEditTags(e.target.value)}
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
                                {format(new Date(task.due_date), "PPP")}
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
                            {task.tags && (
                              <p className="text-xs mt-1 text-blue-400">
                                🏷️{" "}
                                {task.tags.split(",").map((tag) => (
                                  <span
                                    key={tag}
                                    className="inline-block mr-1 bg-blue-600 text-white px-2 py-1 rounded text-xs"
                                  >
                                    {tag.trim()}
                                  </span>
                                ))}
                              </p>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // ne indítsa el az editet
                                togglePinTask(task.id, task.pinned);
                              }}
                              title={task.pinned ? "Unpin task" : "Pin task"}
                              className="absolute right-0 top-0 bg-white dark:bg-gray-800 text-black dark:text-white rounded-full p-2 shadow hover:scale-105 transition w-10 h-10 flex items-center justify-center"
                            >
                              {task.pinned ? "📌" : "📍"}
                            </button>
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
      {(showStatsPanel || isAnimatingOut) && (
        <div className="fixed inset-0 z-[9999] bg-black bg-opacity-50 flex sm:items-start items-center justify-center sm:justify-end">
          <div
            className={`bg-white dark:bg-gray-900 text-black dark:text-white 
      w-full h-full sm:w-[400px] sm:h-auto sm:max-h-[100vh] sm:rounded-l-lg shadow-lg overflow-y-auto p-4
      transition-all duration-300 
      ${isAnimatingOut ? "animate-fade-out" : "animate-fade-in"}
    `}
          >
            <div className="relative mb-4">
              {/* Flex konténer a címhez és a chart-választóhoz */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pr-12">
                <h2 className="text-xl font-semibold">📊 Statistics</h2>

                <div className="flex items-center gap-2">
                  <label
                    className="text-sm font-medium"
                    htmlFor="chart-style"
                  >
                    Chart type:
                  </label>
                  <select
                    id="chart-style"
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value)}
                    className="border px-2 py-1 rounded bg-white dark:bg-gray-800 dark:text-white"
                  >
                    <option value="bar">Bar</option>
                    <option value="pie">Pie</option>
                  </select>
                </div>
              </div>

              <button
                className="absolute top-0 right-0 w-8 h-8 text-sm flex items-center justify-center 
               rounded-full bg-gray-200 dark:bg-gray-900 text-gray-800 dark:text-white 
               hover:text-red-600 transition"
                onClick={closeStatsPanel}
              >
                ✖
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 shadow flex flex-col items-center">
                <span className="text-2xl font-bold">{tasks.length}</span>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  All tasks
                </span>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-4 shadow flex flex-col items-center">
                <span className="text-2xl font-bold">
                  {tasks.filter((t) => !t.completed).length}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Active
                </span>
              </div>
              <div className="bg-green-100 dark:bg-green-900 rounded-lg p-4 shadow flex flex-col items-center">
                <span className="text-2xl font-bold">
                  {tasks.filter((t) => t.completed).length}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Completed
                </span>
              </div>
              <div className="bg-red-100 dark:bg-red-900 rounded-lg p-4 shadow flex flex-col items-center">
                <span className="text-2xl font-bold">
                  {
                    tasks.filter(
                      (t) =>
                        t.due_date &&
                        !t.completed &&
                        new Date(t.due_date) < new Date()
                    ).length
                  }
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Overdue
                </span>
              </div>
            </div>

            <StatSection title="📅 Weekly Task Breakdown">
              {chartType === "bar" ? (
                <WeeklyBarChart data={weeklyData} isDarkMode={darkMode} />
              ) : (
                <WeeklyPieChart data={weeklyData} isDarkMode={darkMode} />
              )}
            </StatSection>

            <StatSection title="🔥 Tasks by Priority">
              {chartType === "bar" ? (
                <PriorityBarChart data={priorityData} isDarkMode={darkMode} />
              ) : (
                <PriorityPieChart data={priorityData} isDarkMode={darkMode} />
              )}
            </StatSection>
          </div>
        </div>
      )}
    </div>
  );
}
