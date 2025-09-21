"use client"
import React from "react"
import { useState, useEffect } from "react"
import { DashboardLayout } from "../../../components/layout/dashboard-layout"
import { Button } from "../../../components/ui/button"
import { DataTable } from "../../../components/ui/data-table"
import { Badge } from "../../../components/ui/badge"
import { Plus, Edit, Trash2, FileText, Filter, Search } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import { apiClient } from "../../../lib/api"
import { PurchaseOrderForm } from "../../../components/forms/purchase-order-form"
import { useToast } from "../../../hooks/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../../../components/ui/alert-dialog"
import { Input } from "../../../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"

interface PurchaseOrder {
  id: string
  poNumber: string
  poDate: string
  vendorId: string
  vendor: {
    id: string
    name: string
    email: string
    mobile: string
  }
  vendorRef: string
  status: "DRAFT" | "CONFIRMED" | "CANCELLED" | "CONVERTED"
  subtotal: number
  taxAmount: number
  total: number
  createdAt: string
}

const createColumns = (handleEditOrder: (order: PurchaseOrder) => void, handleDeleteOrder: (order: PurchaseOrder) => void): ColumnDef<PurchaseOrder>[] => [
  {
    accessorKey: "poNumber",
    header: "PO Number",
    cell: ({ row }) => (
      <div className="font-mono font-medium">{row.getValue("poNumber")}</div>
    ),
  },
  {
    accessorKey: "poDate",
    header: "PO Date",
    cell: ({ row }) => {
      const date = new Date(row.getValue("poDate"))
      return date.toLocaleDateString()
    },
  },
  {
    accessorKey: "vendor.name",
    header: "Vendor",
    cell: ({ row }) => {
      const vendor = row.original.vendor
      return (
        <div>
          <div className="font-medium">{vendor.name}</div>
          <div className="text-sm text-muted-foreground">{vendor.email}</div>
        </div>
      )
    },
  },
  {
    accessorKey: "vendorRef",
    header: "Vendor Ref",
    cell: ({ row }) => {
      const ref = row.getValue("vendorRef") as string
      return ref ? <span className="text-sm">{ref}</span> : <span className="text-muted-foreground">-</span>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      const variants = {
        "DRAFT": "secondary",
        "CONFIRMED": "default", 
        "CANCELLED": "destructive",
        "CONVERTED": "outline"
      } as const
      return <Badge variant={variants[status as keyof typeof variants] || "secondary"}>{status}</Badge>
    },
  },
  {
    accessorKey: "total",
    header: "Total Amount",
    cell: ({ row }) => {
      const amount = parseFloat((row.getValue("total") as number).toString())
      return (
        <div className="text-right font-medium">
          ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      )
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const order = row.original
      const canEdit = order.status === "DRAFT" || order.status === "CONFIRMED"
      const canDelete = order.status === "DRAFT"
      
      return (
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="sm" title="View Details">
            <FileText className="h-4 w-4" />
          </Button>
          {canEdit && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleEditOrder(order)}
              title="Edit Order"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {canDelete && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleDeleteOrder(order)}
              title="Delete Order"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    },
  },
]

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null)
  const [deletingOrder, setDeletingOrder] = useState<PurchaseOrder | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    loadOrders()
  }, [])

  useEffect(() => {
    loadOrders()
  }, [statusFilter, searchTerm])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (statusFilter !== "all") {
        params.status = statusFilter
      }
      if (searchTerm) {
        params.search = searchTerm
      }
      
      const response = await apiClient.getPurchaseOrders(params)
      setOrders(response.data || [])
    } catch (error) {
      console.error("Failed to load purchase orders:", error)
      toast({
        title: "Error",
        description: "Failed to load purchase orders",
        variant: "destructive",
      })
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const handleNewOrder = () => {
    setEditingOrder(null)
    setIsFormOpen(true)
  }

  const handleEditOrder = (order: PurchaseOrder) => {
    setEditingOrder(order)
    setIsFormOpen(true)
  }

  const handleFormSuccess = () => {
    loadOrders()
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingOrder(null)
  }

  const handleDeleteOrder = async (order: PurchaseOrder) => {
    try {
      await apiClient.deletePurchaseOrder(order.id)
      toast({
        title: "Success",
        description: `Purchase order ${order.poNumber} deleted successfully`,
      })
      loadOrders()
    } catch (error) {
      console.error("Failed to delete purchase order:", error)
      toast({
        title: "Error",
        description: "Failed to delete purchase order",
        variant: "destructive",
      })
    }
  }

  return (
    <DashboardLayout
      title="Purchase Orders"
      headerActions={
        <Button onClick={handleNewOrder}>
          <Plus className="mr-2 h-4 w-4" />
          New Purchase Order
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="mr-2 h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by PO number, vendor, or reference..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="CONVERTED">Converted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Draft</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {orders.filter(o => o.status === "DRAFT").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {orders.filter(o => o.status === "CONFIRMED").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{orders.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading purchase orders...</p>
            </div>
          </div>
        ) : (
          <DataTable
            columns={createColumns(handleEditOrder, (order) => setDeletingOrder(order))}
            data={orders}
            searchKey="poNumber"
            searchPlaceholder="Search purchase orders..."
          />
        )}
      </div>
      
      <PurchaseOrderForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        order={editingOrder}
      />

      <AlertDialog open={!!deletingOrder} onOpenChange={() => setDeletingOrder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Purchase Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete purchase order <strong>{deletingOrder?.poNumber}</strong>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingOrder) {
                  handleDeleteOrder(deletingOrder)
                  setDeletingOrder(null)
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}