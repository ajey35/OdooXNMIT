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

interface VendorBillFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  bill?: {
    id: string
    billNumber: string
    billDate: string
    dueDate: string
    vendorId: string
    vendorName: string
    purchaseOrderId?: string
    billReference?: string
    paymentStatus: "PAID" | "UNPAID" | "PARTIAL"
    subtotal: number
    taxAmount: number
    total: number
    paidAmount: number
  } | null
}

interface Contact {
  id: string
  name: string
  type: "CUSTOMER" | "VENDOR"
}

interface BillItem {
  id: string
  productId: string
  productName: string
  description: string
  quantity: number
  unitPrice: number
  taxId?: string
  total: number
}

export function VendorBillForm({ isOpen, onClose, onSuccess, bill }: VendorBillFormProps) {
  const [formData, setFormData] = useState({
    billDate: bill?.billDate ? new Date(bill.billDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    dueDate: bill?.dueDate ? new Date(bill.dueDate).toISOString().split('T')[0] : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    vendorId: bill?.vendorId || "",
    purchaseOrderId: bill?.purchaseOrderId || "",
    billReference: bill?.billReference || "",
    paymentStatus: bill?.paymentStatus || "UNPAID",
    paidAmount: bill?.paidAmount || 0,
    notes: "",
  })
  const [items, setItems] = useState<BillItem[]>([])
  const [vendors, setVendors] = useState<Contact[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      loadVendors()
      loadProducts()
      if (bill) {
        // Load existing items if editing
        setItems([])
      } else {
        // Add one empty item for new bill
        setItems([{
          id: Date.now().toString(),
          productId: "",
          productName: "",
          description: "",
          quantity: 1,
          unitPrice: 0,
          total: 0,
        }])
      }
    }
  }, [isOpen, bill])

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

  const loadProducts = async () => {
    try {
      const response = await apiClient.getProducts()
      setProducts(response.data || [])
    } catch (error) {
      console.error("Failed to load products:", error)
      // Fallback mock data for demo
      setProducts([
        { id: "1", name: "Office Chair", type: "GOODS", salesPrice: 15000, purchasePrice: 12000 },
        { id: "2", name: "Wooden Table", type: "GOODS", salesPrice: 25000, purchasePrice: 20000 },
        { id: "3", name: "Installation Service", type: "SERVICE", salesPrice: 5000, purchasePrice: 3000 },
      ])
    }
  }

  const addItem = () => {
    const newItem: BillItem = {
      id: Date.now().toString(),
      productId: "",
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

  const updateItem = (id: string, field: keyof BillItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value }
        if (field === 'productId') {
          const product = products.find(p => p.id === value)
          if (product) {
            updatedItem.productName = product.name
            updatedItem.unitPrice = product.purchasePrice
            updatedItem.total = updatedItem.quantity * updatedItem.unitPrice
          }
        } else if (field === 'quantity' || field === 'unitPrice') {
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
      
      // Transform items to match backend API format
      const transformedItems = items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxId: item.taxId || null,
      }))

      const billData = {
        vendorId: formData.vendorId,
        billDate: new Date(formData.billDate).toISOString(),
        dueDate: new Date(formData.dueDate).toISOString(),
        purchaseOrderId: formData.purchaseOrderId || null,
        billReference: formData.billReference || null,
        items: transformedItems,
      }

      if (bill) {
        await apiClient.updateVendorBill(bill.id, billData)
        toast({
          title: "Success",
          description: "Vendor bill updated successfully",
        })
      } else {
        await apiClient.createVendorBill(billData)
        toast({
          title: "Success",
          description: "Vendor bill created successfully",
        })
      }
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error saving vendor bill:", error)
      toast({
        title: "Error",
        description: "Failed to save vendor bill. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      billDate: bill?.billDate ? new Date(bill.billDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      dueDate: bill?.dueDate ? new Date(bill.dueDate).toISOString().split('T')[0] : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      vendorId: bill?.vendorId || "",
      purchaseOrderId: bill?.purchaseOrderId || "",
      billReference: bill?.billReference || "",
      paymentStatus: bill?.paymentStatus || "UNPAID",
      paidAmount: bill?.paidAmount || 0,
      notes: "",
    })
    setItems([{
      id: Date.now().toString(),
      productId: "",
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
          <DialogTitle>{bill ? "Edit Vendor Bill" : "Create New Vendor Bill"}</DialogTitle>
          <DialogDescription>
            {bill ? "Update the vendor bill information below." : "Create a new vendor bill for your purchase."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="billDate">Bill Date</Label>
              <Input
                id="billDate"
                type="date"
                value={formData.billDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, billDate: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vendorId">Vendor</Label>
              <Select
                value={formData.vendorId}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, vendorId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="billReference">Bill Reference</Label>
              <Input
                id="billReference"
                value={formData.billReference}
                onChange={(e) => setFormData((prev) => ({ ...prev, billReference: e.target.value }))}
                placeholder="e.g., BILL-2024-001"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentStatus">Payment Status</Label>
              <Select
                value={formData.paymentStatus}
                onValueChange={(value: "PAID" | "UNPAID" | "PARTIAL") =>
                  setFormData((prev) => ({ ...prev, paymentStatus: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UNPAID">Unpaid</SelectItem>
                  <SelectItem value="PARTIAL">Partial</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paidAmount">Paid Amount (₹)</Label>
              <Input
                id="paidAmount"
                type="number"
                min="0"
                step="0.01"
                value={formData.paidAmount}
                onChange={(e) => setFormData((prev) => ({ ...prev, paidAmount: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Bill Items</Label>
              <Button type="button" onClick={addItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-6 gap-2 items-end">
                  <div className="col-span-2">
                    <Label>Product</Label>
                    <Select
                      value={item.productId}
                      onValueChange={(value) => updateItem(item.id, 'productId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1">
                    <Label>Qty</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="col-span-1">
                    <Label>Unit Price</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-1">
                    <Label>Total</Label>
                    <div className="text-sm font-medium p-2 border rounded">₹{item.total.toFixed(2)}</div>
                  </div>
                  <div className="flex items-center">
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
            <div className="flex justify-between text-sm text-gray-600">
              <span>Paid Amount:</span>
              <span>₹{formData.paidAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-medium text-red-600 border-t pt-1">
              <span>Outstanding:</span>
              <span>₹{(total - formData.paidAmount).toFixed(2)}</span>
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
              {loading ? "Saving..." : bill ? "Update Bill" : "Create Bill"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}