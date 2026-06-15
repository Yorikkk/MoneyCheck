const COLORS = [
  '#F44336', '#E91E63', '#9C27B0', '#673AB7',
  '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4',
  '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
  '#FF9800', '#FF5722', '#795548', '#607D8B',
]

export function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`w-8 h-8 rounded-full transition-all ${
            value === c ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'ring-1 ring-gray-300'
          }`}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  )
}