"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { ProductForm } from "@/components/forms/product-form"
import { Plus, Edit, Trash2 } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import { apiClient } from "@/lib/api"

interface Product {
  id: string
  name: string
  type: "GOODS" | "SERVICE"
  salesPrice: number
  purchasePrice: number
  salesTaxPercent: number
  purchaseTaxPercent: number
  hsnCode: string
  category: string
  createdAt: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: "name",
      header: "Product Name",
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("type") as string
        return <Badge variant={type === "GOODS" ? "default" : "secondary"}>{type}</Badge>
      },
    },
    {
      accessorKey: "category",
      header: "Category",
    },
    {
      accessorKey: "hsnCode",
      header: "HSN Code",
    },
    {
      accessorKey: "salesPrice",
      header: "Sales Price",
      cell: ({ row }) => {
        const price = row.getValue("salesPrice") as number
        return `₹${price.toLocaleString()}`
      },
    },
    {
      accessorKey: "salesTaxPercent",
      header: "Sales Tax",
      cell: ({ row }) => {
        const tax = row.getValue("salesTaxPercent") as number
        return `${tax}%`
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const product = row.original
        return (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditingProduct(product)
                setShowForm(true)
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const response = await apiClient.getProducts()
      setProducts(response.data || [])
    } catch (error) {
      console.error("Failed to load products:", error)
      // Mock data for demo
      setProducts([
        {
          id: "1",
          name: "Office Chair",
          type: "GOODS",
          salesPrice: 15000,
          purchasePrice: 12000,
          salesTaxPercent: 18,
          purchaseTaxPercent: 18,
          hsnCode: "94013000",
          category: "Furniture",
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          name: "Wooden Table",
          type: "GOODS",
          salesPrice: 25000,
          purchasePrice: 20000,
          salesTaxPercent: 18,
          purchaseTaxPercent: 18,
          hsnCode: "94036000",
          category: "Furniture",
          createdAt: new Date().toISOString(),
        },
        {
          id: "3",
          name: "Installation Service",
          type: "SERVICE",
          salesPrice: 5000,
          purchasePrice: 3000,
          salesTaxPercent: 18,
          purchaseTaxPercent: 18,
          hsnCode: "998599",
          category: "Services",
          createdAt: new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await apiClient.deleteProduct(id)
        loadProducts()
      } catch (error) {
        console.error("Failed to delete product:", error)
      }
    }
  }

  const handleFormSuccess = () => {
    loadProducts()
    setEditingProduct(null)
  }

  return (
    <DashboardLayout
      title="Product Master"
      headerActions={
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Product
        </Button>
      }
    >
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading products...</p>
            </div>
          </div>
        ) : (
          <DataTable columns={columns} data={products} searchKey="name" searchPlaceholder="Search products..." />
        )}

        <ProductForm
          open={showForm}
          onOpenChange={(open) => {
            setShowForm(open)
            if (!open) setEditingProduct(null)
          }}
          product={editingProduct}
          onSuccess={handleFormSuccess}
        />
      </div>
    </DashboardLayout>
  )
}
