export default function InputWithError({
    value,
    onChange,
    placeholder,
    error,
    className = "",
    type = "text",
    as = "input", // új prop
    rows = 3,
  }) {
    return (
      <div className="w-full">
        {as === "textarea" ? (
          <textarea
            rows={rows}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={`${className} ${error ? "border-red-500" : ""}`}
          />
        ) : (
          <input
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
  