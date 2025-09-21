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
    vendorId: string
    vendorRef: string
    status: string
    items?: Array<{
      id: string
      productId: string
      quantity: number
      unitPrice: number
      taxAmount: number
      total: number
      taxId?: string | null
      product?: {
        id: string
        name: string
        type: string
      }
    }>
  } | null
}

interface Contact {
  id: string
  name: string
  type: "CUSTOMER" | "VENDOR"
}

interface Product {
  id: string
  name: string
  type: "GOODS" | "SERVICE"
  salesPrice: number
  purchasePrice?: number
  hsnCode?: string
  category?: string
  taxPercentage?: number
}

interface OrderItem {
  id: string
  productId: string
  description: string
  quantity: number
  unitPrice: number
  taxPercentage: number
  taxAmount: number
  total: number
  taxId?: string | null
}

export function PurchaseOrderForm({ isOpen, onClose, onSuccess, order }: PurchaseOrderFormProps) {
  const [formData, setFormData] = useState({
    poNumber: order?.poNumber || "",
    poDate: order?.poDate ? new Date(order.poDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    vendorId: order?.vendorId || "",
    vendorRef: order?.vendorRef || "",
    notes: "",
  })
  const [isGeneratingNumber, setIsGeneratingNumber] = useState(false)
  const [items, setItems] = useState<OrderItem[]>([])
  const [vendors, setVendors] = useState<Contact[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      loadVendors()
      loadProducts()
      if (order) {
        // Load existing form data for editing
        setFormData({
          poNumber: order.poNumber || "",
          poDate: order.poDate ? new Date(order.poDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          vendorId: order.vendorId || "",
          vendorRef: order.vendorRef || "",
          notes: "",
        })
        // Load existing items if editing
        setItems(order.items?.map((item: any) => ({
          id: item.id || Date.now().toString(),
          productId: item.productId || "",
          description: item.product?.name || "",
          quantity: parseFloat(item.quantity?.toString() || "1"),
          unitPrice: parseFloat(item.unitPrice?.toString() || "0"),
          taxPercentage: 18, // Default tax percentage
          taxAmount: parseFloat(item.taxAmount?.toString() || "0"),
          total: parseFloat(item.total?.toString() || "0"),
          taxId: item.taxId || null,
        })) || [])
      } else {
        // Generate PO number for new order
        generatePONumber()
        // Add one empty item for new order
        setItems([{
          id: Date.now().toString(),
          productId: "",
          description: "",
          quantity: 1,
          unitPrice: 0,
          taxPercentage: 18,
          taxAmount: 0,
          total: 0,
          taxId: null,
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
      setVendors([
        { id: "1", name: "Azure Furniture", type: "VENDOR" },
        { id: "2", name: "Global Suppliers", type: "VENDOR" },
      ])
    }
  }

  const loadProducts = async () => {
    try {
      const response = await apiClient.getProducts()
      setProducts(response.data || [])
    } catch (error) {
      console.error("Failed to load products:", error)
      setProducts([
        { id: "101", name: "Office Chair", type: "GOODS", salesPrice: 8000, purchasePrice: 6000, hsnCode: "9401", category: "Furniture", taxPercentage: 18 },
        { id: "102", name: "Conference Table", type: "GOODS", salesPrice: 25000, purchasePrice: 18000, hsnCode: "9403", category: "Furniture", taxPercentage: 18 },
        { id: "103", name: "Laptop Stand", type: "GOODS", salesPrice: 3000, purchasePrice: 2000, hsnCode: "8471", category: "Electronics", taxPercentage: 18 },
        { id: "104", name: "Cleaning Service", type: "SERVICE", salesPrice: 1500, purchasePrice: 1000, category: "Services", taxPercentage: 18 },
      ])
    }
  }

  const generatePONumber = async () => {
    setIsGeneratingNumber(true)
    try {
      // Get current year
      const currentYear = new Date().getFullYear()
      
      // Try to get the latest PO number from existing purchase orders
      const response = await apiClient.getPurchaseOrders({ limit: 1 })
      const existingOrders = response.data || []
      
      let nextNumber = 1
      
      if (existingOrders.length > 0) {
        // Extract number from the latest PO number
        const latestPONumber = existingOrders[0].poNumber || ""
        const yearPrefix = `PO${currentYear}`
        
        if (latestPONumber.startsWith(yearPrefix)) {
          // Extract the number part after the year
          const numberPart = latestPONumber.substring(yearPrefix.length)
          const lastNumber = parseInt(numberPart, 10)
          if (!isNaN(lastNumber)) {
            nextNumber = lastNumber + 1
          }
        }
      }
      
      // Generate new PO number: PO2025001, PO2025002, etc.
      const newPONumber = `PO${currentYear}${nextNumber.toString().padStart(3, '0')}`
      
      setFormData(prev => ({ ...prev, poNumber: newPONumber }))
    } catch (error) {
      console.error("Failed to generate PO number:", error)
      // Fallback to timestamp-based number
      const timestamp = Date.now().toString().slice(-6)
      const currentYear = new Date().getFullYear()
      const fallbackNumber = `PO${currentYear}${timestamp}`
      setFormData(prev => ({ ...prev, poNumber: fallbackNumber }))
    } finally {
      setIsGeneratingNumber(false)
    }
  }

  const addItem = () => {
    const newItem: OrderItem = {
      id: Date.now().toString(),
      productId: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      taxPercentage: 18,
      taxAmount: 0,
      total: 0,
      taxId: null,
    }
    setItems([...items, newItem])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) setItems(items.filter(item => item.id !== id))
  }

  const updateItem = (id: string, field: keyof OrderItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value }
        
        // If product is selected, update product details and price
        if (field === 'productId') {
          const selectedProduct = products.find(p => p.id === value)
          if (selectedProduct) {
            updatedItem.unitPrice = selectedProduct.purchasePrice || selectedProduct.salesPrice
            updatedItem.taxPercentage = selectedProduct.taxPercentage || 18
            // Auto-fill description with product name if empty
            if (!updatedItem.description) {
              updatedItem.description = selectedProduct.name
            }
          }
        }
        
        // Calculate tax and total when quantity, unit price, tax percentage, or product changes
        if (field === "quantity" || field === "unitPrice" || field === 'taxPercentage' || field === 'productId') {
          const subtotal = parseFloat(updatedItem.quantity.toString()) * parseFloat(updatedItem.unitPrice.toString())
          updatedItem.taxAmount = (subtotal * parseFloat(updatedItem.taxPercentage.toString())) / 100
          updatedItem.total = subtotal + updatedItem.taxAmount
        }
        return updatedItem
      }
      return item
    }))
  }

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.quantity.toString()) * parseFloat(item.unitPrice.toString())), 0)
    const taxAmount = items.reduce((sum, item) => sum + parseFloat(item.taxAmount.toString()), 0)
    const total = subtotal + taxAmount
    return { subtotal, taxAmount, total }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.vendorId) {
        toast({ title: "Error", description: "Please select a vendor", variant: "destructive" })
        return
      }

      if (items.length === 0 || items.some(item => !item.productId)) {
        toast({ title: "Error", description: "Please add at least one item with a product", variant: "destructive" })
        return
      }

      const orderItems = items.map(item => ({
        productId: item.productId,
        quantity: parseFloat(item.quantity.toString()),
        unitPrice: parseFloat(item.unitPrice.toString()),
        taxId: item.taxId || null,
      }))

      const orderData = {
        vendorId: formData.vendorId,
        poDate: new Date(formData.poDate).toISOString(),
        vendorRef: formData.vendorRef || null,
        items: orderItems,
      }

      if (order) {
        await apiClient.updatePurchaseOrder(order.id, orderData)
        toast({ title: "Success", description: "Purchase order updated successfully" })
      } else {
        await apiClient.createPurchaseOrder(orderData)
        toast({ title: "Success", description: "Purchase order created successfully" })
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error(error)
      const errorMessage = error?.response?.data?.message || "Failed to save purchase order"
      toast({ title: "Error", description: errorMessage, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    if (order) {
      // Reset to original values for editing
      setFormData({
        poNumber: order?.poNumber || "",
        poDate: order?.poDate ? new Date(order.poDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        vendorId: order?.vendorId || "",
        vendorRef: order?.vendorRef || "",
        notes: "",
      })
    } else {
      // Reset and generate new PO number for new order
      setFormData({
        poNumber: "",
        poDate: new Date().toISOString().split("T")[0],
        vendorId: "",
        vendorRef: "",
        notes: "",
      })
      generatePONumber()
    }
    setItems([{
      id: Date.now().toString(),
      productId: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      taxPercentage: 18,
      taxAmount: 0,
      total: 0,
      taxId: null,
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
          {/* PO Number & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="poNumber">PO Number</Label>
              <div className="flex gap-2">
                <Input
                  id="poNumber"
                  value={formData.poNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, poNumber: e.target.value }))}
                  placeholder={isGeneratingNumber ? "Generating..." : "e.g., PO2025001"}
                  required
                  className="flex-1"
                />
                {!order && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generatePONumber}
                    disabled={isGeneratingNumber}
                  >
                    {isGeneratingNumber ? "Generating..." : "Generate"}
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="poDate">PO Date</Label>
              <Input
                id="poDate"
                type="date"
                value={formData.poDate}
                onChange={(e) => setFormData(prev => ({ ...prev, poDate: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Vendor & Reference */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vendorId">Vendor</Label>
              <Select
                value={formData.vendorId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, vendorId: value }))}
                required
              >
                <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                <SelectContent>
                  {vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendorRef">Vendor Reference</Label>
              <Input
                id="vendorRef"
                value={formData.vendorRef}
                onChange={(e) => setFormData(prev => ({ ...prev, vendorRef: e.target.value }))}
              />
            </div>
          </div>

          {/* Order Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Order Items</Label>
              <Button type="button" onClick={addItem} size="sm">
                <Plus className="h-4 w-4 mr-2" /> Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.id} className="grid grid-cols-7 gap-2 items-end">
                  <div className="col-span-2">
                    <Label>Product</Label>
                    <Select
                      value={item.productId}
                      onValueChange={(value) => updateItem(item.id, 'productId', value)}
                      required
                    >
                      <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                      <SelectContent>
                        {products.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{p.name}</span>
                              <span className="text-sm text-gray-500">
                                {p.type} • {p.category || 'No Category'}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label>Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Qty</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div>
                    <Label>Unit Price</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className={item.productId ? "bg-green-50 border-green-200" : ""}
                        placeholder="0.00"
                        required
                      />
                      {item.productId && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                            Auto
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label>Tax %</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={item.taxPercentage}
                        onChange={(e) => updateItem(item.id, 'taxPercentage', parseFloat(e.target.value) || 0)}
                        className={item.productId ? "bg-purple-50 border-purple-200" : ""}
                        placeholder="18"
                      />
                      {item.productId && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
                            Auto
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium">₹{parseFloat(item.total.toString()).toFixed(2)}</span>
                    {items.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(item.id)} className="ml-2">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between"><span>Subtotal:</span><span>₹{parseFloat(subtotal.toString()).toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Tax (18%):</span><span>₹{parseFloat(taxAmount.toString()).toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total:</span><span>₹{parseFloat(total.toString()).toFixed(2)}</span></div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleReset}>Reset</Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : order ? "Update Order" : "Create Order"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
