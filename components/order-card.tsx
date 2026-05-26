'use client'

import { Order } from '@/lib/types'
import { Check, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OrderCardProps {
  order: Order
  timeAgo: string
  isDragging: boolean
  onDelivered?: (orderId: string) => void
  onClick: () => void
}

export function OrderCard({ order, timeAgo, isDragging, onDelivered, onClick }: OrderCardProps) {
  const handleDeliveredClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelivered?.(order.id)
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-card rounded-lg p-3 shadow-sm border border-border cursor-pointer transition-all hover:shadow-md',
        isDragging && 'shadow-lg ring-2 ring-primary rotate-2',
        order.delivered && 'opacity-60'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={cn('flex-1 min-w-0', order.delivered && 'line-through')}>
          <p className="font-bold text-foreground text-sm truncate">
            OS: {order.order_number}
          </p>
          <p className="text-muted-foreground text-xs truncate mt-0.5">
            {order.client_name}
          </p>
        </div>
        
        {onDelivered && (
          <button
            onClick={handleDeliveredClick}
            className={cn(
              'flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
              order.delivered 
                ? 'bg-emerald-500 border-emerald-500 text-white' 
                : 'border-muted-foreground/30 hover:border-emerald-500 hover:bg-emerald-50'
            )}
            aria-label={order.delivered ? 'Marcar como não entregue' : 'Marcar como entregue'}
          >
            {order.delivered && <Check className="h-3 w-3" />}
          </button>
        )}
      </div>
      
      <div className="flex items-center gap-1 mt-2 text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span className="text-xs">{timeAgo}</span>
      </div>
    </div>
  )
}
