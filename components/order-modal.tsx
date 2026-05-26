'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Order } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Save, Trash2, Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'
import { format } from 'date-fns'
import Image from 'next/image'

interface OrderModalProps {
  isOpen: boolean
  onClose: () => void
  order: Order | null
  userId: string
  currentDate: Date
  onSave: () => void
}

export function OrderModal({ isOpen, onClose, order, userId, currentDate, onSave }: OrderModalProps) {
  const [orderNumber, setOrderNumber] = useState('')
  const [clientName, setClientName] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [observations, setObservations] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  useEffect(() => {
    if (order) {
      setOrderNumber(order.order_number)
      setClientName(order.client_name)
      setDeliveryDate(order.delivery_date)
      setObservations(order.observations || '')
      setImageUrl(order.image_url)
      setImagePreview(order.image_url)
    } else {
      setOrderNumber('')
      setClientName('')
      setDeliveryDate(format(currentDate, 'yyyy-MM-dd'))
      setObservations('')
      setImageUrl(null)
      setImagePreview(null)
    }
    setImageFile(null)
  }, [order, currentDate, isOpen])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setImageUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `orders/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('order-images')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Error uploading image:', uploadError)
      return null
    }

    const { data: { publicUrl } } = supabase.storage
      .from('order-images')
      .getPublicUrl(filePath)

    return publicUrl
  }

  const handleSave = async () => {
    if (!orderNumber.trim() || !clientName.trim() || !deliveryDate) {
      return
    }

    setIsSaving(true)

    let finalImageUrl = imageUrl

    // Upload new image if selected
    if (imageFile) {
      finalImageUrl = await uploadImage(imageFile)
    }

    const orderData = {
      order_number: orderNumber.trim(),
      client_name: clientName.trim(),
      delivery_date: deliveryDate,
      observations: observations.trim() || null,
      image_url: finalImageUrl,
      user_id: userId,
      created_date: format(currentDate, 'yyyy-MM-dd'),
    }

    if (order) {
      // Update existing order
      const { error } = await supabase
        .from('orders')
        .update(orderData)
        .eq('id', order.id)

      if (error) {
        console.error('Error updating order:', error)
      }
    } else {
      // Create new order
      const { error } = await supabase
        .from('orders')
        .insert([{ ...orderData, status: 'pending' }])

      if (error) {
        console.error('Error creating order:', error)
      }
    }

    setIsSaving(false)
    onSave()
    onClose()
  }

  const handleDelete = async () => {
    if (!order) return

    setIsDeleting(true)

    // Delete image from storage if exists
    if (order.image_url) {
      const imagePath = order.image_url.split('/').pop()
      if (imagePath) {
        await supabase.storage
          .from('order-images')
          .remove([`orders/${imagePath}`])
      }
    }

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', order.id)

    if (error) {
      console.error('Error deleting order:', error)
    }

    setIsDeleting(false)
    onSave()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {order ? 'Editar OS' : 'Nova OS'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="orderNumber">N da OS *</Label>
            <Input
              id="orderNumber"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="Ex: 12345"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientName">Nome do Cliente *</Label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Nome do cliente"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deliveryDate">Prazo de Entrega *</Label>
            <Input
              id="deliveryDate"
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Imagem</Label>
            <div className="flex flex-col gap-2">
              {imagePreview ? (
                <div className="relative w-full h-40 rounded-lg overflow-hidden border border-border">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg hover:border-primary transition-colors"
                >
                  <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Clique para enviar imagem</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observations">Observacoes</Label>
            <Textarea
              id="observations"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Observacoes adicionais..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          {order && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || isSaving}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Excluir
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={isSaving || isDeleting || !orderNumber.trim() || !clientName.trim() || !deliveryDate}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
