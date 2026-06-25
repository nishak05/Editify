export default function LayerPanel({ layers, groups, selected }) {
  const sections   = groupLayers(layers, groups)
  const selectedId = getSelectedLayerId(selected)

  return (
    <div className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0 overflow-hidden">

      <div className="px-4 py-3 border-b border-gray-800">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Layers
        </span>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {sections.map(section => (
          <div key={section.groupId ?? '__ungrouped__'} className="mb-1">

            {section.label && (
              <div className="px-4 py-1 flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium truncate">{section.label}</span>
                <span className="text-xs text-gray-700 ml-auto">{section.layers.length}</span>
              </div>
            )}

            {section.layers.map(layer => {
              const label = layer.type === 'text'
                ? (layer.text  || 'Text')
                : (layer.label || `Object ${layer.id}`)

              return (
                <div
                  key={layer.id}
                  className={`flex items-center gap-2 py-1.5 px-4 mx-1 rounded transition-colors
                    ${section.groupId ? 'pl-7' : ''}
                    ${layer.id === selectedId ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0
                    ${layer.type === 'text' ? 'bg-blue-400' : 'bg-emerald-400'}`}
                  />
                  <span className="text-xs text-gray-300 truncate flex-1">{label}</span>
                  <span className="text-xs text-gray-600 flex-shrink-0">{layer.type}</span>
                </div>
              )
            })}

          </div>
        ))}
      </div>

    </div>
  )
}


function getSelectedLayerId(selected) {
  if (!selected) return null
  if (selected.data?.layerId !== undefined) return selected.data.layerId
  if (selected._objects?.[0]?.data?.layerId !== undefined) return selected._objects[0].data.layerId
  return null
}


function groupLayers(layers, groups) {
  if (!layers || layers.length === 0) return []

  const groupMap  = {}
  const sections  = []
  const ungrouped = []

  if (groups && groups.length > 0) {
    groups.forEach(g => {
      groupMap[g.id] = { groupId: g.id, label: g.label, layers: [] }
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
    sections.push({ groupId: null, label: null, layers: ungrouped })
  }

  return sections
}