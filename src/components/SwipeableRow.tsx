import { useState, useRef, useCallback, type ReactNode } from 'react'

interface SwipeableRowProps {
  children: ReactNode
  onClick?: () => void
  onDelete: () => void
  onRepeat: () => void
}

const SWIPE_THRESHOLD = -60
const ACTION_WIDTH = 160
const DRAG_THRESHOLD = 5

export default function SwipeableRow({ children, onClick, onDelete, onRepeat }: SwipeableRowProps) {
  const [offset, setOffset] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const startXRef = useRef(0)
  const currentOffsetRef = useRef(0)
  const wasDraggedRef = useRef(false)

  const close = useCallback(() => {
    setIsTransitioning(true)
    setOffset(0)
    setIsOpen(false)
    setTimeout(() => setIsTransitioning(false), 200)
  }, [])

  const open = useCallback(() => {
    setIsTransitioning(true)
    setOffset(-ACTION_WIDTH)
    setIsOpen(true)
    setTimeout(() => setIsTransitioning(false), 200)
  }, [])

  const toggle = useCallback(() => {
    if (isOpen) {
      close()
    } else {
      open()
    }
  }, [isOpen, close, open])

  const handleDelete = useCallback(() => {
    close()
    onDelete()
  }, [close, onDelete])

  const handleRepeat = useCallback(() => {
    close()
    onRepeat()
  }, [close, onRepeat])

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (isOpen) {
        close()
        return
      }
      startXRef.current = e.touches[0].clientX
      currentOffsetRef.current = 0
      setIsTransitioning(false)
    },
    [isOpen, close]
  )

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const deltaX = e.touches[0].clientX - startXRef.current
    if (deltaX > 0) return
    if (Math.abs(deltaX) > DRAG_THRESHOLD) {
      wasDraggedRef.current = true
    }
    const newOffset = Math.max(deltaX, -ACTION_WIDTH)
    currentOffsetRef.current = newOffset
    setOffset(newOffset)
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (currentOffsetRef.current < SWIPE_THRESHOLD) {
      open()
    } else {
      close()
    }
  }, [open, close])

  const finishMouseDrag = useCallback(() => {
    if (currentOffsetRef.current < SWIPE_THRESHOLD) {
      open()
    } else {
      close()
    }
  }, [open, close])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isOpen) {
        close()
        return
      }
      startXRef.current = e.clientX
      currentOffsetRef.current = 0
      wasDraggedRef.current = false
      setIsTransitioning(false)

      const handleMouseMove = (e: MouseEvent) => {
        const deltaX = e.clientX - startXRef.current
        if (deltaX > 0) {
          if (wasDraggedRef.current) {
            currentOffsetRef.current = deltaX
            setOffset(deltaX)
          }
          return
        }
        if (Math.abs(deltaX) > DRAG_THRESHOLD) {
          wasDraggedRef.current = true
        }
        const newOffset = Math.max(deltaX, -ACTION_WIDTH)
        currentOffsetRef.current = newOffset
        setOffset(newOffset)
      }

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        finishMouseDrag()
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [isOpen, close, finishMouseDrag]
  )

  const handleCardClick = useCallback(() => {
    if (wasDraggedRef.current) {
      wasDraggedRef.current = false
      return
    }
    onClick?.()
  }, [onClick])

  const handleTriggerClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      toggle()
    },
    [toggle]
  )

  return (
    <div className="relative overflow-hidden" style={{ touchAction: 'pan-y' }}>
      <div
        className="absolute right-0 top-0 bottom-0 flex"
        style={{ width: ACTION_WIDTH }}
      >
        <button
          onClick={handleRepeat}
          className="w-20 flex items-center justify-center bg-blue-500 text-white text-sm font-medium"
        >
          Повтор
        </button>
        <button
          onClick={handleDelete}
          className="w-20 flex items-center justify-center bg-red-500 text-white text-sm font-medium"
        >
          Удалить
        </button>
      </div>
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onClick={handleCardClick}
        style={{
          transform: `translateX(${offset}px)`,
          transition: isTransitioning ? 'transform 0.2s ease' : 'none',
        }}
      >
        <div className="flex items-stretch">
          <div className="flex-1 min-w-0">{children}</div>
          <button
            onClick={handleTriggerClick}
            className="w-6 flex items-center justify-center text-gray-400 hover:text-gray-600 shrink-0 cursor-pointer bg-white"
          >
            ⋮
          </button>
        </div>
      </div>
    </div>
  )
}