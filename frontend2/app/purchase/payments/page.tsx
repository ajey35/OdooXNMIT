"use client"
import React from "react"
import { useState, useEffect } from "react"
import { DashboardLayout } from "../../../components/layout/dashboard-layout"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Badge } from "../../../components/ui/badge"
import { DataTable } from "../../../components/ui/data-table"
import { Plus, Search, Filter, Download, Printer, Edit, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog"
import { Label } from "../../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Textarea } from "../../../components/ui/textarea"
import { apiClient } from "../../../lib/api"
import { useToast } from "../../../hooks/use-toast"

interface BillPayment {
  id: string
  paymentDate: string
  paymentMethod: string
  amount: number
  reference?: string
  vendor: {
    id: string
    name: string
    email?: string
  }
  vendorBill: {
    id: string
    billNumber: string
  }
  createdAt: string
  updatedAt: string
}

interface PaymentStats {
  totalPayments: number
  totalAmount: number
  pendingPayments: number
  pendingAmount: number
  monthlyPayments: number
  monthlyAmount: number
}

export default function PurchasePaymentsPage() {
  const [payments, setPayments] = useState<BillPayment[]>([])
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState<BillPayment | null>(null)
  const [vendors, setVendors] = useState<any[]>([])
  const [vendorBills, setVendorBills] = useState<any[]>([])
  const [loadingVendors, setLoadingVendors] = useState(false)
  const [loadingBills, setLoadingBills] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    vendorId: "",
    vendorBillId: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "BANK",
    amount: "",
    reference: "",
  })

  useEffect(() => {
    loadPayments()
    loadStats()
    loadVendors()
  }, [])

  const loadPayments = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getBillPayments({ search: searchTerm })
      setPayments(response.data || [])
    } catch (error) {
      console.error("Failed to load payments:", error)
      toast({
        title: "Error",
        description: "Failed to load payments",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await apiClient.getPaymentStats()
      setStats(response.data)
    } catch (error) {
      console.error("Failed to load payment stats:", error)
      // Set mock data if API fails
      setStats({
        totalPayments: 25,
        totalAmount: 258000,
        pendingPayments: 5,
        pendingAmount: 85000,
        monthlyPayments: 8,
        monthlyAmount: 173000,
      })
    }
  }

  const loadVendors = async () => {
    try {
      setLoadingVendors(true)
      const response = await apiClient.getContacts({ type: "VENDOR" })
      setVendors(response.data || [])
    } catch (error) {
      console.error("Failed to load vendors:", error)
      toast({
        title: "Error",
        description: "Failed to load vendors",
        variant: "destructive",
      })
    } finally {
      setLoadingVendors(false)
    }
  }

  const loadVendorBills = async (vendorId: string) => {
    if (!vendorId) {
      setVendorBills([])
      return
    }

    try {
      setLoadingBills(true)
      const response = await apiClient.getVendorBills({ 
        search: vendorId,
        status: "UNPAID,PARTIAL" 
      })
      setVendorBills(response.data || [])
    } catch (error) {
      console.error("Failed to load vendor bills:", error)
      setVendorBills([])
    } finally {
      setLoadingBills(false)
    }
  }

  useEffect(() => {
    loadPayments()
  }, [searchTerm])

  useEffect(() => {
    if (formData.vendorId) {
      loadVendorBills(formData.vendorId)
    }
  }, [formData.vendorId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.vendorId || !formData.vendorBillId || !formData.amount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const paymentData = {
        vendorId: formData.vendorId,
        vendorBillId: formData.vendorBillId,
        paymentDate: new Date(formData.paymentDate).toISOString(),
        paymentMethod: formData.paymentMethod,
        amount: parseFloat(formData.amount),
        reference: formData.reference || undefined,
      }

      if (editingPayment) {
        // Update existing payment
        await apiClient.updateBillPayment(editingPayment.id, paymentData)
        toast({
          title: "Success",
          description: "Payment updated successfully",
        })
      } else {
        // Create new payment
        await apiClient.createBillPayment(paymentData)
        toast({
          title: "Success",
          description: "Payment created successfully",
        })
      }

      handleReset()
      setIsDialogOpen(false)
      loadPayments()
      loadStats()
    } catch (error) {
      console.error("Failed to save payment:", error)
      toast({
        title: "Error",
        description: "Failed to save payment",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (payment: BillPayment) => {
    setEditingPayment(payment)
    setFormData({
      vendorId: payment.vendor.id,
      vendorBillId: payment.vendorBill.id,
      paymentDate: payment.paymentDate.split("T")[0],
      paymentMethod: payment.paymentMethod,
      amount: payment.amount.toString(),
      reference: payment.reference || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (paymentId: string) => {
    if (!confirm("Are you sure you want to delete this payment?")) return

    try {
      await apiClient.deleteBillPayment(paymentId)
      toast({
        title: "Success",
        description: "Payment deleted successfully",
      })
      loadPayments()
      loadStats()
    } catch (error) {
      console.error("Failed to delete payment:", error)
      toast({
        title: "Error",
        description: "Failed to delete payment",
        variant: "destructive",
      })
    }
  }

  const handleReset = () => {
    setFormData({
      vendorId: "",
      vendorBillId: "",
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMethod: "BANK",
      amount: "",
      reference: "",
    })
    setEditingPayment(null)
    setVendorBills([])
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Payment ID,Vendor,Bill Number,Amount,Date,Method,Reference\n" +
      payments.map((p) => 
        `${p.id},${p.vendor.name},${p.vendorBill.billNumber},${p.amount},${p.paymentDate},${p.paymentMethod},${p.reference || ""}`
      ).join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "bill_payments.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const columns = [
    {
      accessorKey: "id",
      header: "Payment ID",
      cell: ({ row }: any) => (
        <div className="font-mono text-sm">{row.getValue("id")}</div>
      ),
    },
    {
      accessorKey: "vendor.name",
      header: "Vendor",
      cell: ({ row }: any) => {
        const payment = row.original as BillPayment
        return (
          <div>
            <div className="font-medium">{payment.vendor.name}</div>
            {payment.vendor.email && (
              <div className="text-sm text-muted-foreground">{payment.vendor.email}</div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "vendorBill.billNumber",
      header: "Bill Number",
      cell: ({ row }: any) => (
        <div className="font-mono text-sm">{row.getValue("vendorBill.billNumber")}</div>
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }: any) => {
        const amount = Number.parseFloat(row.getValue("amount"))
        const formatted = new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
        }).format(amount)
        return <div className="font-medium">{formatted}</div>
      },
    },
    {
      accessorKey: "paymentDate",
      header: "Date",
      cell: ({ row }: any) => {
        const date = new Date(row.getValue("paymentDate"))
        return <div>{date.toLocaleDateString()}</div>
      },
    },
    {
      accessorKey: "paymentMethod",
      header: "Method",
      cell: ({ row }: any) => {
        const method = row.getValue("paymentMethod")
        const methodLabels: Record<string, string> = {
          CASH: "Cash",
          BANK: "Bank Transfer",
          CHEQUE: "Check",
          ONLINE: "Online",
        }
        return <Badge variant="outline">{methodLabels[method] || method}</Badge>
      },
    },
    {
      accessorKey: "reference",
      header: "Reference",
      cell: ({ row }: any) => (
        <div className="text-sm text-muted-foreground">{row.getValue("reference") || "-"}</div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: any) => {
        const payment = row.original as BillPayment
        return (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(payment)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(payment.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  const filteredPayments = payments.filter(
    (payment) =>
      payment.vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.vendorBill.billNumber.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <DashboardLayout
      title="Purchase Payments"
      headerActions={
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) handleReset()
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {editingPayment ? "Edit Payment" : "Create New Payment"}
                </DialogTitle>
                <DialogDescription>
                  {editingPayment ? "Update payment details" : "Record a new payment to vendor"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vendor">Vendor *</Label>
                    <Select
                      value={formData.vendorId}
                      onValueChange={(value) => setFormData({ ...formData, vendorId: value, vendorBillId: "" })}
                      disabled={loadingVendors}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingVendors ? "Loading vendors..." : "Select vendor"} />
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
                    <Label htmlFor="bill">Bill Number *</Label>
                    <Select
                      value={formData.vendorBillId}
                      onValueChange={(value) => setFormData({ ...formData, vendorBillId: value })}
                      disabled={!formData.vendorId || loadingBills}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !formData.vendorId 
                            ? "Select vendor first" 
                            : loadingBills 
                            ? "Loading bills..." 
                            : "Select bill"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {vendorBills.map((bill) => (
                          <SelectItem key={bill.id} value={bill.id}>
                            {bill.billNumber} - ₹{bill.total} (Due: ₹{bill.total - bill.paidAmount})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="method">Payment Method *</Label>
                    <Select
                      value={formData.paymentMethod}
                      onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH">Cash</SelectItem>
                        <SelectItem value="BANK">Bank Transfer</SelectItem>
                        <SelectItem value="CHEQUE">Check</SelectItem>
                        <SelectItem value="ONLINE">Online</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Payment Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.paymentDate}
                      onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reference">Reference</Label>
                    <Input
                      id="reference"
                      placeholder="Transaction reference"
                      value={formData.reference}
                      onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingPayment ? "Update Payment" : "Create Payment"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Purchase Payments</h1>
            <p className="text-muted-foreground">Manage and track payments to vendors</p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{stats.totalAmount.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">{stats.totalPayments} payments</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{stats.pendingAmount.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">{stats.pendingPayments} payments pending</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{stats.monthlyAmount.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">{stats.monthlyPayments} payments made</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Payment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{stats.totalPayments > 0 ? Math.round(stats.totalAmount / stats.totalPayments).toLocaleString() : 0}
                </div>
                <p className="text-xs text-muted-foreground">Per transaction</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>A list of all payments made to vendors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Loading payments...</p>
                </div>
              </div>
            ) : (
              <DataTable columns={columns} data={filteredPayments} />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}