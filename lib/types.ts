export type OrderStatus = 'pending' | 'production' | 'finished'

export interface Order {
  id: string
  order_number: string
  client_name: string
  delivery_date: string
  image_url: string | null
  observations: string | null
  status: OrderStatus
  delivered: boolean
  created_at: string
  created_date: string
  user_id: string
}

export interface OrderFormData {
  order_number: string
  client_name: string
  delivery_date: string
  image: File | null
  observations: string
}
