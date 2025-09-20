"use client"
import React from "react"
import { useState, useEffect } from "react"
import { DashboardLayout } from "../../../components/layout/dashboard-layout"
import { Button } from "../../../components/ui/button"
import { DataTable } from "../../../components/ui/data-table"
import { Badge } from "../../../components/ui/badge"
import { Plus, Edit, Trash2 } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import { apiClient } from "../../../lib/api"
import { TaxForm } from "../../../components/forms/taxes-form"

interface Tax {
  id: string
  name: string
  computationMethod: "PERCENTAGE" | "FIXED_VALUE"
  rate: number
  applicableOnSales: boolean
  applicableOnPurchase: boolean
  createdAt: string
}

const createColumns = (handleEditTax: (tax: Tax) => void): ColumnDef<Tax>[] => [
  {
    accessorKey: "name",
    header: "Tax Name",
  },
  {
    accessorKey: "computationMethod",
    header: "Method",
    cell: ({ row }) => {
      const method = row.getValue("computationMethod") as string
      return <Badge variant="outline">{method === "PERCENTAGE" ? "Percentage" : "Fixed Value"}</Badge>
    },
  },
  {
    accessorKey: "rate",
    header: "Rate",
    cell: ({ row }) => {
      const rate = row.getValue("rate") as number
      const method = row.original.computationMethod
      return method === "PERCENTAGE" ? `${rate}%` : `₹${rate}`
    },
  },
  {
    accessorKey: "applicableOnSales",
    header: "Sales",
    cell: ({ row }) => {
      const applicable = row.getValue("applicableOnSales") as boolean
      return <Badge variant={applicable ? "default" : "secondary"}>{applicable ? "Yes" : "No"}</Badge>
    },
  },
  {
    accessorKey: "applicableOnPurchase",
    header: "Purchase",
    cell: ({ row }) => {
      const applicable = row.getValue("applicableOnPurchase") as boolean
      return <Badge variant={applicable ? "default" : "secondary"}>{applicable ? "Yes" : "No"}</Badge>
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      return (
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => handleEditTax(row.original)}>
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

export default function TaxesPage() {
  const [taxes, setTaxes] = useState<Tax[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTax, setEditingTax] = useState<Tax | null>(null)

  useEffect(() => {
    loadTaxes()
  }, [])

  const loadTaxes = async () => {
    try {
      const response = await apiClient.getTaxes()
      setTaxes(response.data || [])
    } catch (error) {
      console.error("Failed to load taxes:", error)
      // Mock data for demo
      setTaxes([
        {
          id: "1",
          name: "GST 5%",
          computationMethod: "PERCENTAGE",
          rate: 5,
          applicableOnSales: true,
          applicableOnPurchase: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          name: "GST 12%",
          computationMethod: "PERCENTAGE",
          rate: 12,
          applicableOnSales: true,
          applicableOnPurchase: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: "3",
          name: "GST 18%",
          computationMethod: "PERCENTAGE",
          rate: 18,
          applicableOnSales: true,
          applicableOnPurchase: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: "4",
          name: "Fixed Processing Fee",
          computationMethod: "FIXED_VALUE",
          rate: 500,
          applicableOnSales: true,
          applicableOnPurchase: false,
          createdAt: new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleNewTax = () => {
    setEditingTax(null)
    setIsFormOpen(true)
  }

  const handleEditTax = (tax: Tax) => {
    setEditingTax(tax)
    setIsFormOpen(true)
  }

  const handleFormSuccess = () => {
    loadTaxes()
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingTax(null)
  }

  return (
    <DashboardLayout
      title="Tax Master"
      headerActions={
        <Button onClick={handleNewTax}>
          <Plus className="mr-2 h-4 w-4" />
          New Tax
        </Button>
      }
    >
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading taxes...</p>
            </div>
          </div>
        ) : (
          <DataTable columns={createColumns(handleEditTax)} data={taxes} searchKey="name" searchPlaceholder="Search taxes..." />
        )}
      </div>
      
      <TaxForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        tax={editingTax}
      />
    </DashboardLayout>
  )
}