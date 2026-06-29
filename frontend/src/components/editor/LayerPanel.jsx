import { useState } from 'react'

export default function LayerPanel({ layers, groups, selected, fabricRef, onSelectGroup, canvasVersion, onBump }) {
  const sections  = buildTree(layers, groups)
  const selectedIds = getSelectedIds(selected)

  return (
    <div className="w-72 bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0 overflow-hidden">

      <div className="px-5 py-4 border-b border-gray-800">
        <span className="text-x1 font-semibold text-gray-400 uppercase tracking-wider">
          Layers
        </span>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {sections.map(section => (
          section.isGroup
            ? <GroupRow
                key={section.groupId}
                section={section}
                selectedIds={selectedIds}
                fabricRef={fabricRef}
                onSelectGroup={onSelectGroup}
                onBump={onBump}
              />
            : section.layers.map(layer => (
                <LayerRow
                  key={layer.id}
                  layer={layer}
                  isSelected={selectedIds.has(layer.id)}
                  indented={false}
                  fabricRef={fabricRef}
                  onBump={onBump}
                />
              ))
        ))}
      </div>

    </div>
  )
}


function GroupRow({ section, selectedIds, fabricRef, onSelectGroup, onBump }) {
  const [expanded, setExpanded] = useState(true)
  const allSelected = section.layers.every(l => selectedIds.has(l.id))

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 py-2 px-3 mx-1 rounded cursor-pointer transition-colors
          ${allSelected ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
        onClick={() => onSelectGroup(section.layers)}
      >
        <button
          onClick={e => { e.stopPropagation(); setExpanded(v => !v) }}
          className="text-gray-500 hover:text-gray-300 w-3 flex-shrink-0"
        >
          {expanded ? '▾' : '▸'}
        </button>
        <span className="text-xs text-gray-400 font-medium truncate flex-1">
          {section.label}
        </span>
        <span className="text-xs text-gray-600">{section.layers.length}</span>
        <VisibilityToggle layers={section.layers} fabricRef={fabricRef} onBump={onBump} />
      </div>

      {expanded && section.layers.map(layer => (
        <LayerRow
          key={layer.id}
          layer={layer}
          isSelected={selectedIds.has(layer.id)}
          indented
          fabricRef={fabricRef}
          onBump={onBump}
        />
      ))}
    </div>
  )
}


function LayerRow({ layer, isSelected, indented, fabricRef, onBump }) {
  const label = layer.type === 'text'
    ? (layer.text  || 'Text')
    : (layer.label || `Object ${layer.id}`)

  const handleVisibility = (e) => {
    e.stopPropagation()
    if (!fabricRef?.current) return
    const canvas = fabricRef.current
    const obj    = canvas.getObjects().find(o => o.data?.layerId === layer.id)
    if (!obj) return
    obj.set('visible', !obj.visible)
    canvas.renderAll()
    onBump?.()
  }

  const isVisible = (() => {
    if (!fabricRef?.current) return true
    const obj = fabricRef.current.getObjects().find(o => o.data?.layerId === layer.id)
    return obj ? obj.visible !== false : true
  })()

  const handleSelect = () => {
    if (!fabricRef?.current) return

    const canvas = fabricRef.current

    const obj = canvas.getObjects().find(
      o => o.data?.layerId === layer.id
    )

    if (!obj) return

    canvas.setActiveObject(obj)
    canvas.renderAll()
  }

  return (
    <div
      onClick={handleSelect}
      className={`flex items-center gap-2 py-1.5 mx-1 rounded transition-colors
        ${indented ? 'pl-7 pr-2' : 'px-3'}
        ${isSelected ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
      
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0
        ${layer.type === 'text' ? 'bg-blue-400' : 'bg-emerald-400'}`}
      />
      <span className="text-xs text-gray-300 truncate flex-1">{label}</span>
      <span className="text-xs text-gray-600 flex-shrink-0">{layer.type}</span>
      <button
        onClick={handleVisibility}
        title={isVisible ? 'Hide' : 'Show'}
        className="text-gray-600 hover:text-gray-300 transition-colors flex-shrink-0"
      >
        {isVisible ? <EyeIcon /> : <EyeOffIcon />}
      </button>
    </div>
  )
}


function VisibilityToggle({ layers, fabricRef, onBump }) {
  if (!fabricRef?.current) return null

  const canvas = fabricRef.current

  const objects = canvas.getObjects().filter(o =>
    layers.some(l => l.id === o.data?.layerId)
  )

  const anyVisible =
    objects.length === 0
      ? true
      : objects.some(o => o.visible !== false)

  const handleToggle = (e) => {
    e.stopPropagation()

    objects.forEach(o => o.set('visible', !anyVisible))
    canvas.renderAll()
    onBump?.()  
  }

  return (
    <button
      onClick={handleToggle}
      title={anyVisible ? "Hide" : "Show"}
      className="text-gray-600 hover:text-gray-300 transition-colors flex-shrink-0"
    >
      {anyVisible ? <EyeIcon /> : <EyeOffIcon />}
    </button>
  )
}


function buildTree(layers, groups) {
  if (!layers || layers.length === 0) return []

  const groupMap  = {}
  const sections  = []
  const ungrouped = []

  if (groups?.length > 0) {
    groups.forEach(g => {
      groupMap[g.id] = { isGroup: true, groupId: g.id, label: g.label, layers: [] }
      sections.push(groupMap[g.id])
    })
  }

  layers.forEach(layer => {
    if (layer.group_id && groupMap[layer.group_id]) {
      groupMap[layer.group_id].layers.push(layer)
    } else {
      ungrouped.push(layer)
    }
  })

  if (ungrouped.length > 0) {
    sections.push({ isGroup: false, layers: ungrouped })
  }

  return sections
}


function getSelectedIds(selected) {
  const ids = new Set()
  if (!selected) return ids
  if (selected.data?.layerId !== undefined) {
    ids.add(selected.data.layerId)
  }
  if (selected._objects) {
    selected._objects.forEach(obj => {
      if (obj.data?.layerId !== undefined) ids.add(obj.data.layerId)
    })
  }
  return ids
}


const EyeIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3" fill="currentColor"/>
  </svg>
)

const EyeOffIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23" strokeWidth="2.5"/>
  </svg>
)