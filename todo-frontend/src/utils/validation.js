import { toast } from "react-hot-toast";

export function isStrongPassword(password) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

export function validateTaskFields({ title, description, due_date }) {
  const errors = { title: "", description: "", due_date: "" };

  if (!title.trim()) errors.title = "Task title is required.";
  if (description.length > 300)
    errors.description = "Description must be under 300 characters.";
  if (due_date && isNaN(Date.parse(due_date)))
    errors.due_date = "Invalid date format.";
  return errors;
}

export function validateTaskFieldsAndSetErrors(
  { title, description, dueDate },
  setErrors,
  toastMessage
) {
  const errors = validateTaskFields({ title, description, dueDate });
  setErrors(errors);

  const hasError = Object.values(errors).some((val) => val !== "");
  if (hasError) {
    toast.error(toastMessage || "Please correct the errors before submitting.");
    return false;
  }

  return true;
}
