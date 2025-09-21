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
import { log } from "console"

interface SalesOrderFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  order?: {
    id: string
    soNumber: string
    soDate: string
    customer: {
      id: string
      name: string
      email: string
      mobile: string
    }
    soRef: string
    status: "DRAFT" | "CONFIRMED" | "CANCELLED" | "CONVERTED"
    subtotal: number
    taxAmount: number
    total: number
    items?: any[]
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
  hsnCode?: string
  category?: string
  taxPercentage?: number
}

interface OrderItem {
  id: string
  productId: string
  productName: string
  description: string
  quantity: number
  unitPrice: number
  taxPercentage: number
  taxAmount: number
  total: number
}

export function SalesOrderForm({ isOpen, onClose, onSuccess, order }: SalesOrderFormProps) {
  const [formData, setFormData] = useState({
    soNumber: order?.soNumber || "",
    soDate: order?.soDate ? new Date(order.soDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    customerName: order?.customer?.name || "",
    soRef: order?.soRef || "",
    status: order?.status || "DRAFT",
    notes: "",
  })
  const [items, setItems] = useState<OrderItem[]>([])
  const [customers, setCustomers] = useState<Contact[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      loadCustomers()
      loadProducts()
      if (order) {
        // Load existing form data for editing
        setFormData({
          soNumber: order.soNumber || "",
          soDate: order.soDate ? new Date(order.soDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          customerName: order.customer?.name || "",
          soRef: order.soRef || "",
          status: order.status || "DRAFT",
          notes: "",
        })
        // Load existing items if editing
        setItems(order.items?.map((item: any) => ({
          id: item.id || Date.now().toString(),
          productId: item.productId || "",
          productName: item.productName || "",
          description: item.description || "",
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          taxPercentage: item.taxPercentage || 18,
          taxAmount: item.taxAmount || 0,
          total: item.total || 0,
        })) || [])
      } else {
        // Add one empty item for new order
        setItems([{
          id: Date.now().toString(),
          productId: "",
          productName: "",
          description: "",
          quantity: 1,
          unitPrice: 0,
          taxPercentage: 18,
          taxAmount: 0,
          total: 0,
        }])
      }
    }
  }, [isOpen, order])

  const loadCustomers = async () => {
    setLoadingCustomers(true)
    try {
      const response = await apiClient.getContacts({ type: "CUSTOMER" })
      setCustomers(response.data || [])
    } catch (error) {
      console.error("Failed to load customers:", error)
      // Fallback mock data for demo
      setCustomers([
        { id: "1", name: "Nimesh Pathak", type: "CUSTOMER" },
        { id: "2", name: "Global Suppliers", type: "CUSTOMER" },
        { id: "3", name: "Tech Solutions Inc", type: "CUSTOMER" },
        { id: "4", name: "ABC Corporation", type: "CUSTOMER" },
      ])
    } finally {
      setLoadingCustomers(false)
    }
  }

  const loadProducts = async () => {
    setLoadingProducts(true)
    try {
      const response = await apiClient.getProducts()
      console.log("products",response.data)
      setProducts(response.data || [])
    } catch (error) {
      console.error("Failed to load products:", error)
      // Fallback mock data for demo
      setProducts([
        { id: "1", name: "Laptop", type: "GOODS", salesPrice: 50000, hsnCode: "8471", category: "Electronics", taxPercentage: 18 },
        { id: "2", name: "Consulting Service", type: "SERVICE", salesPrice: 5000, category: "Services", taxPercentage: 18 },
        { id: "3", name: "Software License", type: "GOODS", salesPrice: 15000, hsnCode: "8523", category: "Software", taxPercentage: 18 },
        { id: "4", name: "Technical Support", type: "SERVICE", salesPrice: 2000, category: "Services", taxPercentage: 18 },
      ])
    } finally {
      setLoadingProducts(false)
    }
  }

  const addItem = () => {
    const newItem: OrderItem = {
      id: Date.now().toString(),
      productId: "",
      productName: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      taxPercentage: 18,
      taxAmount: 0,
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
        
        // If product is selected, update product details and price
        if (field === 'productId') {
          const selectedProduct = products.find(p => p.id === value)
          if (selectedProduct) {
            updatedItem.productName = selectedProduct.name
            updatedItem.unitPrice = selectedProduct.salesPrice
            updatedItem.taxPercentage = selectedProduct.taxPercentage || 18
            // Auto-fill description with product name if empty
            if (!updatedItem.description) {
              updatedItem.description = selectedProduct.name
            }
          }
        }
        
        // Calculate tax and total when quantity, unit price, tax percentage, or product changes
        if (field === 'quantity' || field === 'unitPrice' || field === 'taxPercentage' || field === 'productId') {
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
      const { subtotal, taxAmount, total } = calculateTotals()
      
      // Find customer ID from customer name
      const selectedCustomer = customers.find(c => c.name === formData.customerName)
      if (!selectedCustomer) {
        toast({
          title: "Error",
          description: "Please select a valid customer",
          variant: "destructive",
        })
        return
      }

      // Transform items to match backend structure
      const transformedItems = items
        .filter(item => item.productId && item.quantity > 0)
        .map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          description: item.description,
        }))

      const orderData = {
        customerId: selectedCustomer.id,
        soDate: new Date(formData.soDate).toISOString(),
        soRef: formData.soRef,
        items: transformedItems,
      }

      if (order) {
        await apiClient.updateSalesOrder(order.id, orderData)
        toast({
          title: "Success",
          description: "Sales order updated successfully",
        })
      } else {
        await apiClient.createSalesOrder(orderData)
        toast({
          title: "Success",
          description: "Sales order created successfully",
        })
      }
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error saving sales order:", error)
      toast({
        title: "Error",
        description: "Failed to save sales order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      soNumber: order?.soNumber || "",
      soDate: order?.soDate ? new Date(order.soDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      customerName: order?.customer?.name || "",
      soRef: order?.soRef || "",
      status: order?.status || "DRAFT",
      notes: "",
    })
    setItems([{
      id: Date.now().toString(),
      productId: "",
      productName: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      taxPercentage: 18,
      taxAmount: 0,
      total: 0,
    }])
  }

  const { subtotal, taxAmount, total } = calculateTotals()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{order ? "Edit Sales Order" : "Create New Sales Order"}</DialogTitle>
          <DialogDescription>
            {order ? "Update the sales order information below." : "Create a new sales order for your customer."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="soNumber">SO Number</Label>
              <Input
                id="soNumber"
                value={formData.soNumber}
                onChange={(e) => setFormData((prev) => ({ ...prev, soNumber: e.target.value }))}
                placeholder="e.g., SO-2024-001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="soDate">SO Date</Label>
              <Input
                id="soDate"
                type="date"
                value={formData.soDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, soDate: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer</Label>
              <Select
                value={formData.customerName}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, customerName: value }))}
                disabled={loadingCustomers}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingCustomers ? "Loading customers..." : "Select customer"} />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.name}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="soRef">Customer Reference</Label>
              <Input
                id="soRef"
                value={formData.soRef}
                onChange={(e) => setFormData((prev) => ({ ...prev, soRef: e.target.value }))}
                placeholder="e.g., REF-001"
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
                <div key={item.id} className="grid grid-cols-8 gap-2 items-end">
                  <div className="col-span-2">
                    <Label>Product</Label>
                    <Select
                      value={item.productId}
                      onValueChange={(value) => updateItem(item.id, 'productId', value)}
                      disabled={loadingProducts}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingProducts ? "Loading products..." : "Select product"} />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - ₹{product.salesPrice}
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
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className={item.productId ? "bg-blue-50 border-blue-200" : ""}
                        placeholder="0.00"
                      />
                      {item.productId && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
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
                        className={item.productId ? "bg-green-50 border-green-200" : ""}
                        placeholder="18"
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
                  <div className="flex items-center">
                    <span className="text-sm font-medium">₹{parseFloat(item.total.toString()).toFixed(2)}</span>
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
              <span>₹{parseFloat(subtotal.toString()).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (18%):</span>
              <span>₹{parseFloat(taxAmount.toString()).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>
              <span>₹{parseFloat(total.toString()).toFixed(2)}</span>
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