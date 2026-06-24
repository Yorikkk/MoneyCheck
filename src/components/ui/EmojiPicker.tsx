import { EMOJIS } from '@/lib/emojis'

export function EmojiPicker({
  value,
  onChange,
  onClose,
}: {
  value: string
  onChange: (emoji: string) => void
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
          <span className="font-semibold text-sm text-gray-500">Выберите иконку</span>
          <button onClick={onClose} className="text-gray-400 text-xl leading-none">&times;</button>
        </div>
        <div className="overflow-y-auto p-3 grid grid-cols-8 sm:grid-cols-10 gap-1">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => { onChange(emoji); onClose() }}
              className={`text-xl sm:text-2xl p-1.5 rounded-lg transition-colors hover:bg-gray-100 ${
                value === emoji ? 'bg-blue-50 ring-2 ring-blue-500' : ''
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}