import { toast } from "react-hot-toast";

export function exportTasksAsCSV(tasks) {
  if (tasks.length === 0) {
    toast.error("No tasks to export.");
    return;
  }

  const headers = ["Title", "Description", "Completed", "Due Date", "Priority"];
  const rows = tasks.map((task) => [
    task.title,
    task.description?.replace(/(\r\n|\n|\r)/gm, " ") || "",
    task.completed ? "Yes" : "No",
    task.due_date ? new Date(task.due_date).toLocaleDateString() : "",
    task.priority || "medium",
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((val) => `"${val}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "tasks.csv");
  link.click();
  return csvContent;
}
