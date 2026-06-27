import { fabric } from 'fabric'

export default function ActionBar({
  selected,
  fabricRef,
  groups,
  setGroups,
  layers,
  setLayers,
  onDelete,
  onSnapshot,
  setSelected,
}) {
  if (!selected) return null

  const canvas      = fabricRef?.current
  const isGroup     = selected?.type === 'group'
  const isMulti     = selected?.type === 'activeSelection'
  const isSomething = selected && canvas

  const handleDuplicate = () => {
    if (!isSomething) return
    selected.clone((cloned) => {
      cloned.set({ left: (cloned.left ?? 0) + 20, top: (cloned.top ?? 0) + 20 })
      if (cloned.type === 'activeSelection') {
        cloned.canvas = canvas
        cloned.forEachObject(obj => canvas.add(obj))
        cloned.setCoords()
      } else {
        canvas.add(cloned)
      }
      canvas.setActiveObject(cloned)
      canvas.renderAll()
      onSnapshot?.()
    })
  }

  const handleGroup = () => {
    if (!isSomething) return

    if (isGroup) {
      const groupId = selected.data?.groupId
      selected.toActiveSelection()
      canvas.discardActiveObject()

      if (groupId) {
        setGroups(prev => prev.filter(g => g.id !== groupId))
        canvas.getObjects().forEach(obj => {
          if (obj.data?.groupId === groupId) {
            obj.data = { ...obj.data, groupId: null, groupRole: null }
          }
        })
      }

      canvas.renderAll()
      onSnapshot?.()
      setSelected(null)
      return
    }

    if (!isMulti) return

    const members = [...selected._objects]
    const groupId = `user_group_${Date.now()}`

    members.forEach(obj => {
      obj.data = { ...obj.data, groupId, groupRole: 'child' }
    })

    const fabricGroup = selected.toGroup()
    fabricGroup.data  = { groupId, type: 'group', label: 'Group' }
    canvas.setActiveObject(fabricGroup)

    setGroups(prev => [...prev, {
      id:     groupId,
      label:  'Group',
      type:   'group',
      source: 'user',
    }])

    canvas.renderAll()
    onSnapshot?.()
    setSelected(fabricGroup)
  }

  const handleLock = () => {
    if (!isSomething) return
    const locked = selected.lockMovementX === true

    const lockProps = locked
      ? { lockMovementX: false, lockMovementY: false, lockScalingX: false, lockScalingY: false, lockRotation: false, selectable: true, hoverCursor: 'move' }
      : { lockMovementX: true,  lockMovementY: true,  lockScalingX: true,  lockScalingY: true,  lockRotation: true,  selectable: true, hoverCursor: 'not-allowed' }

    if (isGroup || isMulti) {
      const items = isGroup ? selected.getObjects() : selected._objects
      items.forEach(obj => obj.set(lockProps))
    }
    selected.set(lockProps)
    canvas.renderAll()
    
    onSnapshot?.()
  }

  const isLocked  = selected?.lockMovementX === true
  const canGroup  = isMulti && !isGroup
  const canUngroup = isGroup

  return (
    <div className="px-4 py-3">
      <p className="text-xs text-gray-500 mb-2">Actions</p>
      <div className="flex items-center gap-1">

        <ActionButton
          title="Duplicate"
          onClick={handleDuplicate}
          icon={<DuplicateIcon />}
        />

        {(canGroup || canUngroup) && (
          <ActionButton
            title={canUngroup ? 'Ungroup' : 'Group'}
            onClick={handleGroup}
            icon={canUngroup ? <UngroupIcon /> : <GroupIcon />}
            label={canUngroup ? 'Ungroup' : 'Group'}
          />
        )}

        <ActionButton
            title={isLocked ? 'Unlock' : 'Lock'}
            onClick={handleLock}
            icon={isLocked ? <LockIcon /> : <UnlockIcon />}
            active={isLocked}
        />

        <ActionButton
          title="Delete"
          onClick={onDelete}
          icon={<DeleteIcon />}
          danger
        />

      </div>
    </div>
  )
}

function ActionButton({ title, onClick, icon, active, danger, label }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`h-8 rounded flex items-center gap-1.5 px-2 transition-colors
        ${danger  ? 'text-red-400 hover:bg-red-900 hover:text-red-200' :
          active  ? 'bg-gray-600 text-white' :
                    'text-gray-400 hover:text-white hover:bg-gray-800'}`}
    >
      {icon}
      {label && <span className="text-xs">{label}</span>}
    </button>
  )
}

const DuplicateIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="8" y="8" width="13" height="13" rx="2"/><path d="M4 16V4a2 2 0 0 1 2-2h12"/>
  </svg>
)

const GroupIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="2" width="8" height="8" rx="1"/><rect x="14" y="2" width="8" height="8" rx="1"/>
    <rect x="2" y="14" width="8" height="8" rx="1"/><rect x="14" y="14" width="8" height="8" rx="1"/>
    <path d="M10 6h4M10 18h4M6 10v4M18 10v4"/>
  </svg>
)

const UngroupIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="2" width="8" height="8" rx="1"/><rect x="14" y="2" width="8" height="8" rx="1"/>
    <rect x="2" y="14" width="8" height="8" rx="1"/><rect x="14" y="14" width="8" height="8" rx="1"/>
  </svg>
)

const LockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

const UnlockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>
  </svg>
)

const DeleteIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)