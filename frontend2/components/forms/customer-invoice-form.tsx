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

interface CustomerInvoiceFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  invoice?: {
    id: string
    invoiceNumber: string
    invoiceDate: string
    dueDate: string
    customerName: string
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

interface InvoiceItem {
  id: string
  productName: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export function CustomerInvoiceForm({ isOpen, onClose, onSuccess, invoice }: CustomerInvoiceFormProps) {
  const [formData, setFormData] = useState({
    invoiceNumber: invoice?.invoiceNumber || "",
    invoiceDate: invoice?.invoiceDate ? new Date(invoice.invoiceDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    dueDate: invoice?.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    customerName: invoice?.customerName || "",
    paymentStatus: invoice?.paymentStatus || "UNPAID",
    paidAmount: invoice?.paidAmount || 0,
    notes: "",
  })
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [customers, setCustomers] = useState<Contact[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      loadCustomers()
      if (invoice) {
        // Load existing items if editing
        setItems([])
      } else {
        // Add one empty item for new invoice
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
  }, [isOpen, invoice])

  const loadCustomers = async () => {
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
    }
  }

  const addItem = () => {
    const newItem: InvoiceItem = {
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

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
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
      const invoiceData = {
        ...formData,
        invoiceDate: new Date(formData.invoiceDate).toISOString(),
        dueDate: new Date(formData.dueDate).toISOString(),
        items,
        subtotal,
        taxAmount,
        total,
      }

      if (invoice) {
        await apiClient.updateCustomerInvoice(invoice.id, invoiceData)
        toast({
          title: "Success",
          description: "Customer invoice updated successfully",
        })
      } else {
        await apiClient.createCustomerInvoice(invoiceData)
        toast({
          title: "Success",
          description: "Customer invoice created successfully",
        })
      }
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error saving customer invoice:", error)
      toast({
        title: "Error",
        description: "Failed to save customer invoice. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      invoiceNumber: invoice?.invoiceNumber || "",
      invoiceDate: invoice?.invoiceDate ? new Date(invoice.invoiceDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      dueDate: invoice?.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      customerName: invoice?.customerName || "",
      paymentStatus: invoice?.paymentStatus || "UNPAID",
      paidAmount: invoice?.paidAmount || 0,
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
          <DialogTitle>{invoice ? "Edit Customer Invoice" : "Create New Customer Invoice"}</DialogTitle>
          <DialogDescription>
            {invoice ? "Update the customer invoice information below." : "Create a new customer invoice for your sale."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData((prev) => ({ ...prev, invoiceNumber: e.target.value }))}
                placeholder="e.g., INV-2024-001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoiceDate">Invoice Date</Label>
              <Input
                id="invoiceDate"
                type="date"
                value={formData.invoiceDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, invoiceDate: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer</Label>
              <Select
                value={formData.customerName}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, customerName: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
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
              <Label>Invoice Items</Label>
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
              {loading ? "Saving..." : invoice ? "Update Invoice" : "Create Invoice"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
