export function IconButton(props) {

  return (
    <div class="flex flex-col items-center py-2">
      <button
        class="flex flex-col items-center justify-center w-14 h-14 hover:bg-gray-200 rounded-xl transition-colors"
        onClick={props.onClick}
      >
        <props.icon class="w-6 h-6 text-gray-600" />
        <span class="mt-1 text-xs text-gray-800 font-medium text-center">
          {props.label}
        </span>
      </button>
    </div>
  )
}