export default function InputWithError({
  id = "",
  value,
  onChange,
  placeholder,
  error,
  className = "",
  type = "text",
  as = "input",
  rows = 3,
}) {
  return (
    <div className="w-full">
      {as === "textarea" ? (
        <textarea
          id={id}
          rows={rows}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`${className} ${error ? "border-red-500" : ""}`}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`${className} ${error ? "border-red-500" : ""}`}
        />
      )}
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
