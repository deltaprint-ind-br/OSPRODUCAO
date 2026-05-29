'use client'

import { useState, useEffect, useCallback } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { createClient } from '@/lib/supabase/client'
import { Order, OrderStatus } from '@/lib/types'
import { OrderCard } from './order-card'
import { OrderModal } from './order-modal'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Plus, LogOut, Clock, Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { format, addDays, subDays, isToday, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface KanbanBoardProps {
  userId: string
}

export function KanbanBoard({ userId }: KanbanBoardProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const supabase = createClient()

  const fetchOrders = useCallback(async () => {
    setIsLoading(true)
    const dateString = format(currentDate, 'yyyy-MM-dd')
    
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('created_date', dateString)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching orders:', error)
    } else {
      setOrders(data || [])
    }
    setIsLoading(false)
  }, [currentDate, supabase])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const { draggableId, destination } = result
    const newStatus = destination.droppableId as OrderStatus
    
    const order = orders.find(o => o.id === draggableId)
    if (!order || order.status === newStatus) return

    // Optimistic update
    setOrders(prev => 
      prev.map(o => o.id === draggableId ? { ...o, status: newStatus } : o)
    )

    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', draggableId)

    if (error) {
      console.error('Error updating order status:', error)
      fetchOrders() // Revert on error
    }
  }

  const handleDelivered = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId)
    if (!order) return

    const newDelivered = !order.delivered

    // Optimistic update
    setOrders(prev =>
      prev.map(o => o.id === orderId ? { ...o, delivered: newDelivered } : o)
    )

    const { error } = await supabase
      .from('orders')
      .update({ delivered: newDelivered })
      .eq('id', orderId)

    if (error) {
      console.error('Error updating delivered status:', error)
      fetchOrders()
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const navigateDay = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => 
      direction === 'next' ? addDays(prev, 1) : subDays(prev, 1)
    )
  }

  const openNewOrderModal = () => {
    setEditingOrder(null)
    setIsModalOpen(true)
  }

  const openEditOrderModal = (order: Order) => {
    setEditingOrder(order)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingOrder(null)
  }

  const getTimeAgo = (createdAt: string) => {
    const created = parseISO(createdAt)
    const now = new Date()
    const diffMs = now.getTime() - created.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`
    if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m`
    return `${diffMins}m`
  }

  // Filter orders based on search query
  const filterOrders = (ordersList: Order[]) => {
    if (!searchQuery.trim()) return ordersList
    const query = searchQuery.toLowerCase()
    return ordersList.filter(
      o => o.order_number.toLowerCase().includes(query) || 
           o.client_name.toLowerCase().includes(query)
    )
  }

  const pendingOrders = filterOrders(orders.filter(o => o.status === 'pending'))
  const productionOrders = filterOrders(orders.filter(o => o.status === 'production'))
  const finishedOrders = filterOrders(orders.filter(o => o.status === 'finished'))

  const columns = [
    { 
      id: 'pending' as const, 
      title: 'PENDENTE', 
      orders: pendingOrders,
      bgColor: 'bg-pending',
      textColor: 'text-pending-foreground',
      headerBg: 'bg-gray-600',
      showAddButton: true
    },
    { 
      id: 'production' as const, 
      title: 'PRODUÇÃO', 
      orders: productionOrders,
      bgColor: 'bg-production',
      textColor: 'text-production-foreground',
      headerBg: 'bg-amber-500',
      showAddButton: false
    },
    { 
      id: 'finished' as const, 
      title: 'FINALIZADO', 
      orders: finishedOrders,
      bgColor: 'bg-finished',
      textColor: 'text-finished-foreground',
      headerBg: 'bg-emerald-500',
      showAddButton: false
    },
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
{/* Header */}
      <header className="bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateDay('prev')}
            aria-label="Dia anterior"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-foreground">
              {format(currentDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              {isToday(currentDate) && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">(Hoje)</span>
              )}
            </div>
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-mono">
                {format(currentTime, 'HH:mm:ss')}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateDay('next')}
              aria-label="Próximo dia"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              aria-label="Sair"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-3 relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por N da OS ou cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Limpar busca"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      {/* Kanban Board */}
      <div className="flex-1 p-4 overflow-x-auto">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 h-full min-h-[calc(100vh-120px)]">
            {columns.map((column) => (
              <div 
                key={column.id} 
                className={`flex-1 min-w-[280px] max-w-[400px] rounded-lg ${column.bgColor} flex flex-col`}
              >
                {/* Column Header */}
                <div className={`${column.headerBg} rounded-t-lg px-4 py-3 flex items-center justify-between`}>
                  <h2 className="font-bold text-white text-sm tracking-wide">
                    {column.title}
                  </h2>
                  <span className="bg-white/20 text-white text-xs font-medium px-2 py-1 rounded-full">
                    {column.orders.length}
                  </span>
                </div>

                {/* Add Button (only for pending column) */}
                {column.showAddButton && isToday(currentDate) && (
                  <div className="px-3 pt-3">
                    <Button
                      onClick={openNewOrderModal}
                      className="w-full bg-gray-700 hover:bg-gray-800 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      +OS
                    </Button>
                  </div>
                )}

                {/* Droppable Area */}
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-3 space-y-2 overflow-y-auto transition-colors ${
                        snapshot.isDraggingOver ? 'bg-black/5' : ''
                      }`}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current"></div>
                        </div>
                      ) : column.orders.length === 0 ? (
                        <div className={`text-center py-8 ${column.textColor} opacity-50`}>
                          <p className="text-sm">Nenhuma OS</p>
                        </div>
                      ) : (
                        column.orders.map((order, index) => (
                          <Draggable 
                            key={order.id} 
                            draggableId={order.id} 
                            index={index}
                            isDragDisabled={!isToday(currentDate)}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <OrderCard
                                  order={order}
                                  timeAgo={getTimeAgo(order.created_at)}
                                  isDragging={snapshot.isDragging}
                                  onDelivered={column.id === 'finished' ? handleDelivered : undefined}
                                  onClick={() => openEditOrderModal(order)}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Order Modal */}
      <OrderModal
        isOpen={isModalOpen}
        onClose={closeModal}
        order={editingOrder}
        userId={userId}
        currentDate={currentDate}
        onSave={fetchOrders}
      />
    </div>
  )
}
