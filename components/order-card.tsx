'use client'

import { Order } from '@/lib/types'
import { Check, Clock, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

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
      <div className="flex items-center gap-3">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
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
                aria-label={order.delivered ? 'Marcar como nao entregue' : 'Marcar como entregue'}
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

        {/* Image Thumbnail */}
        <div className="flex-shrink-0">
          {order.image_url ? (
            <div className="relative w-12 h-12 rounded-md overflow-hidden border border-border">
              <Image
                src={order.image_url}
                alt={`OS ${order.order_number}`}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-md border border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/30">
              <ImageIcon className="h-5 w-5 text-muted-foreground/50" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
