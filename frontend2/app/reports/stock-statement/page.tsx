"use client"
import React from "react"
import { useState } from "react"
import { DashboardLayout } from "../../../components/layout/dashboard-layout"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Badge } from "../../../components/ui/badge"
import { DataTable } from "../../../components/ui/data-table"
import { Search, Filter, Download, Printer, Package, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"

// Mock data for stock statement
const stockData = [
  {
    id: "PRD-001",
    name: "Oak Dining Table",
    category: "Tables",
    currentStock: 15,
    minStock: 5,
    maxStock: 50,
    unitCost: 450,
    totalValue: 6750,
    lastUpdated: "2024-01-15",
    status: "In Stock",
  },
  {
    id: "PRD-002",
    name: "Leather Sofa Set",
    category: "Seating",
    currentStock: 3,
    minStock: 5,
    maxStock: 20,
    unitCost: 1200,
    totalValue: 3600,
    lastUpdated: "2024-01-14",
    status: "Low Stock",
  },
  {
    id: "PRD-003",
    name: "Wooden Bookshelf",
    category: "Storage",
    currentStock: 25,
    minStock: 10,
    maxStock: 40,
    unitCost: 280,
    totalValue: 7000,
    lastUpdated: "2024-01-13",
    status: "In Stock",
  },
  {
    id: "PRD-004",
    name: "Office Chair",
    category: "Seating",
    currentStock: 0,
    minStock: 8,
    maxStock: 30,
    unitCost: 150,
    totalValue: 0,
    lastUpdated: "2024-01-12",
    status: "Out of Stock",
  },
]

const columns = [
  {
    accessorKey: "id",
    header: "Product ID",
  },
  {
    accessorKey: "name",
    header: "Product Name",
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "currentStock",
    header: "Current Stock",
    cell: ({ row }: any) => {
      const stock = row.getValue("currentStock")
      const minStock = row.original.minStock
      return (
        <div className="flex items-center space-x-2">
          <span className="font-medium">{stock}</span>
          {stock <= minStock && stock > 0 && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
          {stock === 0 && <AlertTriangle className="h-4 w-4 text-red-500" />}
        </div>
      )
    },
  },
  {
    accessorKey: "unitCost",
    header: "Unit Cost",
    cell: ({ row }: any) => {
      const cost = Number.parseFloat(row.getValue("unitCost"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(cost)
      return <div>{formatted}</div>
    },
  },
  {
    accessorKey: "totalValue",
    header: "Total Value",
    cell: ({ row }: any) => {
      const value = Number.parseFloat(row.getValue("totalValue"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(value)
      return <div className="font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }: any) => {
      const status = row.getValue("status")
      let variant: "default" | "secondary" | "destructive" = "default"

      if (status === "Low Stock") variant = "secondary"
      if (status === "Out of Stock") variant = "destructive"

      return <Badge variant={variant}>{status}</Badge>
    },
  },
]

export default function StockStatementPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")

  const filteredStock = stockData.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const totalValue = stockData.reduce((sum, item) => sum + item.totalValue, 0)
  const lowStockItems = stockData.filter((item) => item.currentStock <= item.minStock && item.currentStock > 0).length
  const outOfStockItems = stockData.filter((item) => item.currentStock === 0).length
  const totalItems = stockData.reduce((sum, item) => sum + item.currentStock, 0)

  const handlePrint = () => {
    window.print()
  }

  const handleExport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Product ID,Product Name,Category,Current Stock,Unit Cost,Total Value,Status\n" +
      stockData
        .map(
          (item) =>
            `${item.id},${item.name},${item.category},${item.currentStock},${item.unitCost},${item.totalValue},${item.status}`,
        )
        .join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "stock_statement.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <DashboardLayout
      title="Stock Statement"
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
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Stock Statement</h1>
            <p className="text-muted-foreground">Monitor inventory levels and stock valuation</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(totalValue)}
              </div>
              <p className="text-xs text-muted-foreground">Across all products</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItems}</div>
              <p className="text-xs text-muted-foreground">Items in stock</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{lowStockItems}</div>
              <p className="text-xs text-muted-foreground">Need reordering</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{outOfStockItems}</div>
              <p className="text-xs text-muted-foreground">Items unavailable</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Details</CardTitle>
            <CardDescription>Current stock levels and valuation for all products</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Tables">Tables</SelectItem>
                  <SelectItem value="Seating">Seating</SelectItem>
                  <SelectItem value="Storage">Storage</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
            <DataTable columns={columns} data={filteredStock} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
