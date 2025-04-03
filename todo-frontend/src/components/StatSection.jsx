import { useState } from "react";

export default function StatSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mb-4 border rounded overflow-hidden dark:border-gray-700">
      <button
        className="w-full px-4 py-2 flex justify-between items-center bg-gray-100 dark:bg-gray-800 dark:text-white text-left font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        onClick={() => setOpen(!open)}
      >
        <span>{title}</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="p-4 bg-white dark:bg-gray-900">{children}</div>}
    </div>
  );
}
