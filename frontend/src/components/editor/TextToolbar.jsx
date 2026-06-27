import { useState, useEffect } from 'react'

const FONT_OPTIONS = [
  'Arial',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'Trebuchet MS',
  'Impact',
]

export default function TextToolbar({ selected, fabricRef, onPropertyChange }) {
  const [fontSize,   setFontSize]   = useState(24)
  const [fontFamily, setFontFamily] = useState('Arial')
  const [color,      setColor]      = useState('#000000')
  const [bold,       setBold]       = useState(false)
  const [italic,     setItalic]     = useState(false)
  const [underline,  setUnderline]  = useState(false)

  // sync state when selection changes
  useEffect(() => {
    if (!selected || selected.type === 'activeSelection') return
    setFontSize(Math.round(selected.fontSize  ?? 24))
    setFontFamily(selected.fontFamily ?? 'Arial')
    setColor(selected.fill            ?? '#000000')
    setBold(selected.fontWeight       === 'bold')
    setItalic(selected.fontStyle      === 'italic')
    setUnderline(selected.underline   ?? false)
  }, [selected])

  if (!selected || selected.data?.type !== 'text') return null

  const apply = (props) => {
    if (!selected || !fabricRef?.current) return
    selected.set(props)
    fabricRef.current.renderAll()
    onPropertyChange?.()
  }

  const handleFontSize = (val) => {
    const size = Math.max(6, Number(val))
    setFontSize(size)
    apply({ fontSize: size })
  }

  const handleFontFamily = (val) => {
    setFontFamily(val)
    apply({ fontFamily: val })
  }

  const handleColor = (val) => {
    setColor(val)
    apply({ fill: val })
  }

  const handleBold = () => {
    const next = !bold
    setBold(next)
    apply({ fontWeight: next ? 'bold' : 'normal' })
  }

  const handleItalic = () => {
    const next = !italic
    setItalic(next)
    apply({ fontStyle: next ? 'italic' : 'normal' })
  }

  const handleUnderline = () => {
    const next = !underline
    setUnderline(next)
    apply({ underline: next })
  }

  return (
    <div className="h-10 bg-gray-850 border-b border-gray-800 flex items-center px-4 gap-3 flex-shrink-0"
         style={{ backgroundColor: '#161b22' }}>

      {/* font family */}
      <select
        value={fontFamily}
        onChange={e => handleFontFamily(e.target.value)}
        className="bg-gray-800 text-gray-200 text-xs rounded px-2 py-1 border border-gray-700 focus:outline-none"
      >
        {FONT_OPTIONS.map(f => (
          <option key={f} value={f}>{f}</option>
        ))}
      </select>

      {/* font size */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleFontSize(fontSize - 1)}
          className="w-5 h-5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs flex items-center justify-center"
        >−</button>
        <input
          type="number"
          value={fontSize}
          onChange={e => handleFontSize(e.target.value)}
          className="w-12 bg-gray-800 text-gray-200 text-xs text-center rounded px-1 py-1 border border-gray-700 focus:outline-none"
          min={6}
          max={300}
        />
        <button
          onClick={() => handleFontSize(fontSize + 1)}
          className="w-5 h-5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs flex items-center justify-center"
        >+</button>
      </div>

      <div className="w-px h-5 bg-gray-700" />

      {/* color */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-gray-500">Color</span>
        <input
          type="color"
          value={color}
          onChange={e => handleColor(e.target.value)}
          className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
        />
      </div>

      <div className="w-px h-5 bg-gray-700" />

      {/* bold italic underline */}
      <div className="flex items-center gap-1">
        <StyleButton label="B" active={bold}      onClick={handleBold}      style={{ fontWeight: 'bold' }} />
        <StyleButton label="I" active={italic}    onClick={handleItalic}    style={{ fontStyle: 'italic' }} />
        <StyleButton label="U" active={underline} onClick={handleUnderline} style={{ textDecoration: 'underline' }} />
      </div>

    </div>
  )
}


function StyleButton({ label, active, onClick, style }) {
  return (
    <button
      onClick={onClick}
      style={style}
      className={`w-7 h-7 rounded text-sm transition-colors
        ${active
          ? 'bg-gray-600 text-white'
          : 'text-gray-400 hover:text-white hover:bg-gray-800'
        }`}
    >
      {label}
    </button>
  )
}