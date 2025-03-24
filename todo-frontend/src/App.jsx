// React frontend with full login, registration, task management, and filtering
import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { API_BASE } from './config';


export default function TodoApp() {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [token, setToken] = useState('');
	const [loggedInUser, setLoggedInUser] = useState('');
	const [tasks, setTasks] = useState([]);
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [isRegistering, setIsRegistering] = useState(false);
	const [filter, setFilter] = useState('all');
	const [errorMessage, setErrorMessage] = useState('');
	const [editingId, setEditingId] = useState(null);
	const [editTitle, setEditTitle] = useState('');
	const [editDescription, setEditDescription] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [formErrors, setFormErrors] = useState({ title: '', description: '' });

	useEffect(() => {
		const storedToken = localStorage.getItem('token');
		if (storedToken) setToken(storedToken);
	}, []);

	useEffect(() => {
		if (!token) return;
		try {
			const decoded = jwtDecode(token);
			const exp = decoded.exp;
			const now = Date.now() / 1000;
			setLoggedInUser(decoded.sub || '');
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
		const errors = { title: '', description: '' };
		if (!title.trim()) {
			errors.title = 'Task title is required.';
			alert(errors.title);
		}
		if (description.length > 300) {
			errors.description = 'Description must be under 300 characters.';
			alert(errors.description);
		}
		setFormErrors(errors);
		return !errors.title && !errors.description;
	};

	useEffect(() => {
		if (token) fetchTasks();
	}, [token]);

	const logout = () => {
		setToken('');
		localStorage.removeItem('token');
		setTasks([]);
	};

	const validatePassword = (password) => {
		const minLength = 8;
		const hasUpperCase = /[A-Z]/.test(password);
		const hasLowerCase = /[a-z]/.test(password);
		const hasNumber = /[0-9]/.test(password);
		const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
		return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
	};

	const register = async () => {
		setErrorMessage('');
		if (!username || !password) {
			setErrorMessage('Username and password cannot be empty.');
			return;
		}
		if (!validatePassword(password)) {
			setErrorMessage(
				'Password must be at least 8 characters long and include uppercase, lowercase, a number, and a special character.'
			);
			return;
		}
		const res = await fetch(`${API_BASE}/auth/register`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username, password }),
		});
		if (res.ok) {
			alert('Registration successful. You can now log in.');
			setIsRegistering(false);
		} else {
			alert('Registration failed.');
		}
	};

	const login = async () => {
		setErrorMessage('');
		if (!username || !password) {
			setErrorMessage('Username and password cannot be empty.');
			return;
		}
		const res = await fetch(`${API_BASE}/auth/token`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username, password }),
		});
		if (res.ok) {
			const data = await res.json();
			setToken(data.access_token);
			localStorage.setItem('token', data.access_token);
		} else {
			alert('Login failed.');
		}
	};

	const fetchTasks = async () => {
		setIsLoading(true);
		const res = await fetch(`${API_BASE}/tasks/`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		if (res.ok) {
			const data = await res.json();
			setTasks(data);
		}
		setIsLoading(false);
	};

	const createTask = async () => {
		if (!validateTaskForm()) return;
		setIsLoading(true);
		await fetch(`${API_BASE}/tasks/`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ title, description, completed: false }),
		});
		setTitle('');
		setDescription('');
		setFormErrors({ title: '', description: '' });
		await fetchTasks();
		setIsLoading(false);
	};

	const deleteTask = async (id) => {
		await fetch(`${API_BASE}/tasks/${id}`, {
			method: 'DELETE',
			headers: { Authorization: `Bearer ${token}` },
		});
		fetchTasks();
	};

	const toggleTaskCompletion = async (id, completed) => {
		const task = tasks.find((t) => t.id === id);
		if (!task) return;
		await fetch(`${API_BASE}/tasks/${id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				title: task.title,
				description: task.description,
				completed: !completed,
			}),
		});
		fetchTasks();
	};

	const startEdit = (task) => {
		setEditingId(task.id);
		setEditTitle(task.title);
		setEditDescription(task.description);
	};

	const cancelEdit = () => {
		setEditingId(null);
		setEditTitle('');
		setEditDescription('');
	};

	const saveEdit = async (id) => {
		await fetch(`${API_BASE}/tasks/${id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				title: editTitle,
				description: editDescription,
				completed: tasks.find((t) => t.id === id)?.completed || false,
			}),
		});
		cancelEdit();
		fetchTasks();
	};

	const filteredTasks = tasks.filter((task) => {
		if (filter === 'completed') return task.completed;
		if (filter === 'active') return !task.completed;
		return true;
	});

	return (
		<div className="max-w-xl mx-auto p-4">
			{loggedInUser && (
				<p className="text-sm text-gray-600 mb-2">
					👋 Hello, <span className="font-semibold">{loggedInUser}</span>
				</p>
			)}

			<h1 className="text-2xl font-bold mb-4">📝 TODO App</h1>

			{!token ? (
				<div className="space-y-2 mb-4">
					<input
						placeholder="Username"
						className="border p-2 w-full"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
					/>
					<div className="relative">
						<input
							placeholder="Password"
							type={showPassword ? 'text' : 'password'}
							className="border p-2 w-full"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>
						<button
							type="button"
							className="absolute inset-y-0 right-0 px-3 py-2 text-sm text-gray-600"
							onClick={() => setShowPassword(!showPassword)}
						>
							{showPassword ? 'Hide' : 'Show'}
						</button>
					</div>
					{errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}
					{!isRegistering ? (
						<div className="flex gap-2">
							<button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={login}>
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
							<button className="bg-green-600 text-white px-4 py-2 rounded w-full" onClick={register}>
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
					<button onClick={logout} className="text-red-500 underline mb-4">
						Logout
					</button>

					<div className="flex flex-col sm:flex-row gap-2 mb-2">
						<button className="px-2 py-1 border rounded" onClick={() => setFilter('all')}>
							All
						</button>
						<button className="px-2 py-1 border rounded" onClick={() => setFilter('active')}>
							Active
						</button>
						<button className="px-2 py-1 border rounded" onClick={() => setFilter('completed')}>
							Completed
						</button>
					</div>

					<div className="flex flex-col sm:flex-row gap-2 mb-4">
						<input
							placeholder="Task title"
							className="border p-2 flex-1 w-full"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
						/>
						<input
							placeholder="Description"
							className="border p-2 flex-1 w-full"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
						/>
						<button className="bg-green-500 text-white px-4 py-2 rounded w-full sm:w-auto" onClick={createTask}>
							Add
						</button>
					</div>

					<div className="space-y-2">
						{isLoading ? (
							<p className="text-sm text-gray-500">Loading...</p>
						) : (
							filteredTasks.map((task) => (
								<div key={task.id} className="border p-4 rounded flex flex-col sm:flex-row justify-between items-start">
									<div className="flex gap-2 items-start">
										<input
											type="checkbox"
											checked={task.completed}
											onChange={() => toggleTaskCompletion(task.id, task.completed)}
										/>
										{editingId === task.id ? (
											<div className="flex flex-col gap-2">
												<input
													className="border p-1"
													value={editTitle}
													onChange={(e) => setEditTitle(e.target.value)}
												/>
												<input
													className="border p-1"
													value={editDescription}
													onChange={(e) => setEditDescription(e.target.value)}
												/>
												<div className="flex gap-2">
													<button
														onClick={() => saveEdit(task.id)}
														className="text-green-600"
													>
														💾 Save
													</button>
													<button onClick={cancelEdit} className="text-gray-500">
														❌ Cancel
													</button>
												</div>
											</div>
										) : (
											<div onClick={() => startEdit(task)} className="cursor-pointer">
												<h2
													className={`text-lg font-semibold ${
														task.completed ? 'line-through text-gray-400' : 'text-black'
													}`}
												>
													{task.title}
												</h2>
												<p className="text-sm text-gray-600">{task.description}</p>
											</div>
										)}
									</div>
									<button onClick={() => deleteTask(task.id)} className="text-red-500 text-sm">
										🗑️
									</button>
								</div>
							))
						)}
					</div>
				</div>
			)}
		</div>
	);
}
