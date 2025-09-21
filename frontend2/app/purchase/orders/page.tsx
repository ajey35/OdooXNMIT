"use client"
import React from "react"
import { useState, useEffect } from "react"
import { DashboardLayout } from "../../../components/layout/dashboard-layout"
import { Button } from "../../../components/ui/button"
import { DataTable } from "../../../components/ui/data-table"
import { Badge } from "../../../components/ui/badge"
import { Plus, Edit, Trash2, FileText } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import { apiClient } from "../../../lib/api"
import { PurchaseOrderForm } from "../../../components/forms/purchase-order-form"

interface PurchaseOrder {
  id: string
  poNumber: string
  poDate: string
  vendorName: string
  vendorRef: string
  status: "DRAFT" | "CONFIRMED" | "CANCELLED"
  subtotal: number
  taxAmount: number
  total: number
  createdAt: string
}

const createColumns = (handleEditOrder: (order: PurchaseOrder) => void): ColumnDef<PurchaseOrder>[] => [
  {
    accessorKey: "poNumber",
    header: "PO Number",
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
    accessorKey: "vendorName",
    header: "Vendor",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      const variant = status === "CONFIRMED" ? "default" : status === "DRAFT" ? "secondary" : "destructive"
      return <Badge variant={variant}>{status}</Badge>
    },
  },
  {
    accessorKey: "total",
    header: "Total Amount",
    cell: ({ row }) => {
      const amount = row.getValue("total") as number
      return `₹${amount.toLocaleString()}`
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      return (
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon">
            <FileText className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleEditOrder(row.original)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Trash2 className="h-4 w-4" />
          </Button>
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

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      const response = await apiClient.getPurchaseOrders()
      setOrders(response.data || [])
    } catch (error) {
      console.error("Failed to load purchase orders:", error)
      // Mock data for demo
      setOrders([
        {
          id: "1",
          poNumber: "PO-2024-001",
          poDate: new Date().toISOString(),
          vendorName: "Azure Furniture",
          vendorRef: "REQ-25-0001",
          status: "CONFIRMED",
          subtotal: 50000,
          taxAmount: 9000,
          total: 59000,
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          poNumber: "PO-2024-002",
          poDate: new Date().toISOString(),
          vendorName: "Global Suppliers",
          vendorRef: "REQ-25-0002",
          status: "DRAFT",
          subtotal: 25000,
          taxAmount: 4500,
          total: 29500,
          createdAt: new Date().toISOString(),
        },
      ])
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
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading purchase orders...</p>
            </div>
          </div>
        ) : (
          <DataTable
            columns={createColumns(handleEditOrder)}
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
    </DashboardLayout>
  )
}