export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">

      {/* Dark overlay */}

      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}

      <div
        className="
          relative
          w-[420px]
          rounded-2xl
          border
          border-white/10
          bg-[#171B26]
          shadow-2xl
          px-7
          py-6
        "
      >

        <h2 className="text-xl font-semibold text-white">
          {title}
        </h2>

        <p className="mt-3 text-gray-400 leading-relaxed">
          {message}
        </p>

        <div className="mt-8 flex justify-end gap-3">

          <button
            onClick={onCancel}
            className="
              px-5
              py-2
              rounded-lg
              border
              border-white/10
              text-gray-300
              hover:bg-white/5
              transition
            "
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            className="
              px-5
              py-2
              rounded-lg
              bg-red-600
              text-white
              hover:bg-red-500
              transition
            "
          >
            {confirmText}
          </button>

        </div>

      </div>

    </div>
  )
}