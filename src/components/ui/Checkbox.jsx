export function Checkbox({label, checked, onChange, id}) {
  return (
    <label
      htmlFor={id}
      className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 select-none"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="
          w-4 h-4
          border-2 border-blue-500
          rounded-sm
          bg-white
          checked:border-blue-500
          focus:ring-2 focus:ring-blue-400
        "
      />
      {label && <span>{label}</span>}
    </label>
  );
}
