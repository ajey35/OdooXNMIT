"use client"
import React, { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import { Textarea } from "../ui/textarea"
import { apiClient } from "../../lib/api"
import { useToast } from "../../hooks/use-toast"
import { Plus, Trash2 } from "lucide-react"

interface PurchaseOrderFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  order?: {
    id: string
    poNumber: string
    poDate: string
    vendorName: string
    vendorRef: string
    status: "DRAFT" | "CONFIRMED" | "CANCELLED"
    subtotal: number
    taxAmount: number
    total: number
  } | null
}

interface Contact {
  id: string
  name: string
  type: "CUSTOMER" | "VENDOR"
}

interface OrderItem {
  id: string
  productName: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export function PurchaseOrderForm({ isOpen, onClose, onSuccess, order }: PurchaseOrderFormProps) {
  const [formData, setFormData] = useState({
    poNumber: order?.poNumber || "",
    poDate: order?.poDate ? new Date(order.poDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    vendorName: order?.vendorName || "",
    vendorRef: order?.vendorRef || "",
    status: order?.status || "DRAFT",
    notes: "",
  })
  const [items, setItems] = useState<OrderItem[]>([])
  const [vendors, setVendors] = useState<Contact[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      loadVendors()
      if (order) {
        // Load existing items if editing
        setItems([])
      } else {
        // Add one empty item for new order
        setItems([{
          id: Date.now().toString(),
          productName: "",
          description: "",
          quantity: 1,
          unitPrice: 0,
          total: 0,
        }])
      }
    }
  }, [isOpen, order])

  const loadVendors = async () => {
    try {
      const response = await apiClient.getContacts({ type: "VENDOR" })
      setVendors(response.data || [])
    } catch (error) {
      console.error("Failed to load vendors:", error)
      // Fallback mock data for demo
      setVendors([
        { id: "1", name: "Azure Furniture", type: "VENDOR" },
        { id: "2", name: "Global Suppliers", type: "VENDOR" },
        { id: "3", name: "Tech Solutions Inc", type: "VENDOR" },
        { id: "4", name: "ABC Corporation", type: "VENDOR" },
      ])
    }
  }

  const addItem = () => {
    const newItem: OrderItem = {
      id: Date.now().toString(),
      productName: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      total: 0,
    }
    setItems([...items, newItem])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id))
    }
  }

  const updateItem = (id: string, field: keyof OrderItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value }
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.total = updatedItem.quantity * updatedItem.unitPrice
        }
        return updatedItem
      }
      return item
    }))
  }

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0)
    const taxAmount = subtotal * 0.18 // 18% GST
    const total = subtotal + taxAmount
    return { subtotal, taxAmount, total }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { subtotal, taxAmount, total } = calculateTotals()
      const orderData = {
        ...formData,
        poDate: new Date(formData.poDate).toISOString(),
        items,
        subtotal,
        taxAmount,
        total,
      }

      if (order) {
        await apiClient.updatePurchaseOrder(order.id, orderData)
        toast({
          title: "Success",
          description: "Purchase order updated successfully",
        })
      } else {
        await apiClient.createPurchaseOrder(orderData)
        toast({
          title: "Success",
          description: "Purchase order created successfully",
        })
      }
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error saving purchase order:", error)
      toast({
        title: "Error",
        description: "Failed to save purchase order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      poNumber: order?.poNumber || "",
      poDate: order?.poDate ? new Date(order.poDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      vendorName: order?.vendorName || "",
      vendorRef: order?.vendorRef || "",
      status: order?.status || "DRAFT",
      notes: "",
    })
    setItems([{
      id: Date.now().toString(),
      productName: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      total: 0,
    }])
  }

  const { subtotal, taxAmount, total } = calculateTotals()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{order ? "Edit Purchase Order" : "Create New Purchase Order"}</DialogTitle>
          <DialogDescription>
            {order ? "Update the purchase order information below." : "Create a new purchase order for your vendor."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="poNumber">PO Number</Label>
              <Input
                id="poNumber"
                value={formData.poNumber}
                onChange={(e) => setFormData((prev) => ({ ...prev, poNumber: e.target.value }))}
                placeholder="e.g., PO-2024-001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="poDate">PO Date</Label>
              <Input
                id="poDate"
                type="date"
                value={formData.poDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, poDate: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vendorName">Vendor</Label>
              <Select
                value={formData.vendorName}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, vendorName: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.name}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendorRef">Vendor Reference</Label>
              <Input
                id="vendorRef"
                value={formData.vendorRef}
                onChange={(e) => setFormData((prev) => ({ ...prev, vendorRef: e.target.value }))}
                placeholder="e.g., REQ-25-0001"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: "DRAFT" | "CONFIRMED" | "CANCELLED") =>
                setFormData((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Order Items</Label>
              <Button type="button" onClick={addItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-6 gap-2 items-end">
                  <div className="col-span-2">
                    <Label>Product Name</Label>
                    <Input
                      value={item.productName}
                      onChange={(e) => updateItem(item.id, 'productName', e.target.value)}
                      placeholder="Product name"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      placeholder="Description"
                    />
                  </div>
                  <div>
                    <Label>Qty</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div>
                    <Label>Unit Price</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium">₹{item.total.toFixed(2)}</span>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="ml-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (18%):</span>
              <span>₹{taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleReset}>
              Reset
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : order ? "Update Order" : "Create Order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
