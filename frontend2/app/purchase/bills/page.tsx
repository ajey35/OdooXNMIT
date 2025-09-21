"use client"
import React from "react"
import { useState, useEffect } from "react"
import { DashboardLayout } from "../../../components/layout/dashboard-layout"
import { Button } from "../../../components/ui/button"
import { DataTable } from "../../../components/ui/data-table"
import { Badge } from "../../../components/ui/badge"
import { Plus, Edit, Trash2, CreditCard } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import { apiClient } from "../../../lib/api"
import { VendorBillForm } from "../../../components/forms/vendor-bill-form"

interface VendorBill {
  id: string
  billNumber: string
  billDate: string
  dueDate: string
  vendorName: string
  paymentStatus: "PAID" | "UNPAID" | "PARTIAL"
  subtotal: number
  taxAmount: number
  total: number
  paidAmount: number
  createdAt: string
}

const createColumns = (handleEditBill: (bill: VendorBill) => void): ColumnDef<VendorBill>[] => [
  {
    accessorKey: "billNumber",
    header: "Bill Number",
  },
  {
    accessorKey: "billDate",
    header: "Bill Date",
    cell: ({ row }) => {
      const date = new Date(row.getValue("billDate"))
      return date.toLocaleDateString()
    },
  },
  {
    accessorKey: "dueDate",
    header: "Due Date",
    cell: ({ row }) => {
      const date = new Date(row.getValue("dueDate"))
      return date.toLocaleDateString()
    },
  },
  {
    accessorKey: "vendorName",
    header: "Vendor",
  },
  {
    accessorKey: "paymentStatus",
    header: "Payment Status",
    cell: ({ row }) => {
      const status = row.getValue("paymentStatus") as string
      const variant = status === "PAID" ? "default" : status === "PARTIAL" ? "secondary" : "destructive"
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
      const status = row.original.paymentStatus
      return (
        <div className="flex items-center space-x-2">
          {status !== "PAID" && (
            <Button variant="ghost" size="icon">
              <CreditCard className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => handleEditBill(row.original)}>
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

export default function VendorBillsPage() {
  const [bills, setBills] = useState<VendorBill[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingBill, setEditingBill] = useState<VendorBill | null>(null)

  useEffect(() => {
    loadBills()
  }, [])

  const loadBills = async () => {
    try {
      const response = await apiClient.getVendorBills()
      setBills(response.data || [])
    } catch (error) {
      console.error("Failed to load vendor bills:", error)
      // Mock data for demo
      setBills([
        {
          id: "1",
          billNumber: "BILL-2024-001",
          billDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          vendorName: "Azure Furniture",
          paymentStatus: "UNPAID",
          subtotal: 50000,
          taxAmount: 9000,
          total: 59000,
          paidAmount: 0,
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          billNumber: "BILL-2024-002",
          billDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          vendorName: "Global Suppliers",
          paymentStatus: "PAID",
          subtotal: 25000,
          taxAmount: 4500,
          total: 29500,
          paidAmount: 29500,
          createdAt: new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleNewBill = () => {
    setEditingBill(null)
    setIsFormOpen(true)
  }

  const handleEditBill = (bill: VendorBill) => {
    setEditingBill(bill)
    setIsFormOpen(true)
  }

  const handleFormSuccess = () => {
    loadBills()
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingBill(null)
  }

  return (
    <DashboardLayout
      title="Vendor Bills"
      headerActions={
        <Button onClick={handleNewBill}>
          <Plus className="mr-2 h-4 w-4" />
          New Vendor Bill
        </Button>
      }
    >
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading vendor bills...</p>
            </div>
          </div>
        ) : (
          <DataTable columns={createColumns(handleEditBill)} data={bills} searchKey="billNumber" searchPlaceholder="Search vendor bills..." />
        )}
      </div>
      
      <VendorBillForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        bill={editingBill}
      />
    </DashboardLayout>
  )
}