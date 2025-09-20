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

interface CustomerInvoice {
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
  createdAt: string
}

const columns: ColumnDef<CustomerInvoice>[] = [
  {
    accessorKey: "invoiceNumber",
    header: "Invoice Number",
  },
  {
    accessorKey: "invoiceDate",
    header: "Invoice Date",
    cell: ({ row }) => {
      const date = new Date(row.getValue("invoiceDate"))
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
    accessorKey: "customerName",
    header: "Customer",
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
          <Button variant="ghost" size="icon">
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

export default function CustomerInvoicesPage() {
  const [invoices, setInvoices] = useState<CustomerInvoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInvoices()
  }, [])

  const loadInvoices = async () => {
    try {
      const response = await apiClient.getCustomerInvoices()
      setInvoices(response.data || [])
    } catch (error) {
      console.error("Failed to load customer invoices:", error)
      // Mock data for demo
      setInvoices([
        {
          id: "1",
          invoiceNumber: "INV-2024-001",
          invoiceDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          customerName: "Nimesh Pathak",
          paymentStatus: "PAID",
          subtotal: 75000,
          taxAmount: 13500,
          total: 88500,
          paidAmount: 88500,
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          invoiceNumber: "INV-2024-002",
          invoiceDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          customerName: "Global Suppliers",
          paymentStatus: "UNPAID",
          subtotal: 45000,
          taxAmount: 8100,
          total: 53100,
          paidAmount: 0,
          createdAt: new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout
      title="Customer Invoices"
      headerActions={
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Customer Invoice
        </Button>
      }
    >
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading customer invoices...</p>
            </div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={invoices}
            searchKey="invoiceNumber"
            searchPlaceholder="Search customer invoices..."
          />
        )}
      </div>
    </DashboardLayout>
  )
}
