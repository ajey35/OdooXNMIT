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

interface SalesOrder {
  id: string
  soNumber: string
  soDate: string
  customerName: string
  soRef: string
  status: "DRAFT" | "CONFIRMED" | "CANCELLED"
  subtotal: number
  taxAmount: number
  total: number
  createdAt: string
}

const columns: ColumnDef<SalesOrder>[] = [
  {
    accessorKey: "soNumber",
    header: "SO Number",
  },
  {
    accessorKey: "soDate",
    header: "SO Date",
    cell: ({ row }) => {
      const date = new Date(row.getValue("soDate"))
      return date.toLocaleDateString()
    },
  },
  {
    accessorKey: "customerName",
    header: "Customer",
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

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      const response = await apiClient.getSalesOrders()
      setOrders(response.data || [])
    } catch (error) {
      console.error("Failed to load sales orders:", error)
      // Mock data for demo
      setOrders([
        {
          id: "1",
          soNumber: "SO-2024-001",
          soDate: new Date().toISOString(),
          customerName: "Nimesh Pathak",
          soRef: "REF-001",
          status: "CONFIRMED",
          subtotal: 75000,
          taxAmount: 13500,
          total: 88500,
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          soNumber: "SO-2024-002",
          soDate: new Date().toISOString(),
          customerName: "Global Suppliers",
          soRef: "REF-002",
          status: "DRAFT",
          subtotal: 45000,
          taxAmount: 8100,
          total: 53100,
          createdAt: new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout
      title="Sales Orders"
      headerActions={
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Sales Order
        </Button>
      }
    >
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading sales orders...</p>
            </div>
          </div>
        ) : (
          <DataTable columns={columns} data={orders} searchKey="soNumber" searchPlaceholder="Search sales orders..." />
        )}
      </div>
    </DashboardLayout>
  )
}
