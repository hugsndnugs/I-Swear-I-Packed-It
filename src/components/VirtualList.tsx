import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'

interface VirtualListProps<T> {
  items: T[]
  estimateSize?: number
  overscan?: number
  /** Height of the scroll container (e.g. 300 for a fixed-height list). Omit to use parent height. */
  height?: number
  getItemKey: (item: T, index: number) => string
  renderItem: (item: T, index: number) => React.ReactNode
  /** Optional id for the scroll container for aria. */
  ariaLabel?: string
  /** Role for the list (e.g. 'list'). */
  role?: string
  className?: string
}

/**
 * A virtualized list that only renders visible items plus overscan.
 * Use for long lists (ships, commodities, equipment) to improve performance.
 */
export default function VirtualList<T>({
  items,
  estimateSize = 52,
  overscan = 5,
  height,
  getItemKey,
  renderItem,
  ariaLabel,
  role = 'list',
  className = ''
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)
  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan
  })

  const virtualItems = rowVirtualizer.getVirtualItems()
  const totalHeight = rowVirtualizer.getTotalSize()

  const styleHeight = height != null ? height : undefined

  return (
    <div
      ref={parentRef}
      className={'virtual-list-container' + (className ? ` ${className}` : '')}
      style={styleHeight != null ? { height: styleHeight } : undefined}
      aria-label={ariaLabel}
    >
      <div
        style={{
          height: `${totalHeight}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        {virtualItems.map((virtualRow) => {
          const item = items[virtualRow.index]
          const key = getItemKey(item, virtualRow.index)
          return (
            <div
              key={key}
              role={role === 'list' ? 'listitem' : undefined}
              data-index={virtualRow.index}
              aria-setsize={items.length}
              aria-posinset={virtualRow.index + 1}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`
              }}
            >
              {renderItem(item, virtualRow.index)}
            </div>
          )
        })}
      </div>
    </div>
  )
}
