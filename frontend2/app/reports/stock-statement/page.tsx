"use client"
import React from "react"
import { useState, useEffect } from "react"
import { DashboardLayout } from "../../../components/layout/dashboard-layout"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Badge } from "../../../components/ui/badge"
import { DataTable } from "../../../components/ui/data-table"
import { Search, Filter, Download, Printer, Package, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { apiClient } from "../../../lib/api"
import { useToast } from "../../../hooks/use-toast"

interface StockItem {
  product: {
    id: string
    name: string
    category: string
    type: string
    purchasePrice: number
  }
  openingStock: number
  purchases: number
  sales: number
  adjustments: number
  closingStock: number
  stockValue: number
  movements: Array<{
    id: string
    movementType: string
    quantity: number
    movementDate: string
    referenceType: string
    referenceId: string
    description: string
  }>
}

interface StockStatementData {
  asOfDate: string
  items: StockItem[]
  summary: {
    totalProducts: number
    totalStockValue: number
    totalQuantity: number
  }
}

export default function StockStatementPage() {
  const [stockData, setStockData] = useState<StockStatementData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedProduct, setSelectedProduct] = useState<string>("")
  const { toast } = useToast()

  useEffect(() => {
    loadStockStatement()
  }, [selectedProduct])

  const loadStockStatement = async () => {
    setLoading(true)
    try {
      const response = await apiClient.getStockStatement(selectedProduct || undefined)
      setStockData(response.data)
    } catch (error) {
      console.error("Failed to load stock statement:", error)
      toast({
        title: "Error",
        description: "Failed to load stock statement",
        variant: "destructive",
      })
      setStockData(null)
    } finally {
      setLoading(false)
    }
  }

  const filteredStock = stockData?.items.filter((item) => {
    const matchesSearch =
      item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || item.product.category === categoryFilter
    return matchesSearch && matchesCategory
  }) || []

  const totalValue = filteredStock.reduce((sum, item) => sum + item.stockValue, 0)
  const totalQuantity = filteredStock.reduce((sum, item) => sum + item.closingStock, 0)
  const lowStockItems = filteredStock.filter((item) => item.closingStock <= 5 && item.closingStock > 0).length
  const outOfStockItems = filteredStock.filter((item) => item.closingStock === 0).length

  const handlePrint = () => {
    window.print()
  }

  const handleExport = () => {
    if (!stockData) return

    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Product ID,Product Name,Category,Opening Stock,Purchases,Sales,Adjustments,Closing Stock,Unit Cost,Stock Value\n" +
      stockData.items.map((item) =>
        `${item.product.id},${item.product.name},${item.product.category},${item.openingStock},${item.purchases},${item.sales},${item.adjustments},${item.closingStock},${item.product.purchasePrice},${item.stockValue}`,
      ).join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "stock_statement.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const columns = [
    {
      accessorKey: "product.id",
      header: "Product ID",
      cell: ({ row }: any) => (
        <div className="font-mono text-sm">{row.original.product.id}</div>
      ),
    },
    {
      accessorKey: "product.name",
      header: "Product Name",
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">{row.original.product.name}</div>
          <div className="text-sm text-muted-foreground">{row.original.product.category}</div>
        </div>
      ),
    },
    {
      accessorKey: "openingStock",
      header: "Opening",
      cell: ({ row }: any) => (
        <div className="text-center">{row.getValue("openingStock")}</div>
      ),
    },
    {
      accessorKey: "purchases",
      header: "Purchases",
      cell: ({ row }: any) => (
        <div className="text-center text-green-600">+{row.getValue("purchases")}</div>
      ),
    },
    {
      accessorKey: "sales",
      header: "Sales",
      cell: ({ row }: any) => (
        <div className="text-center text-red-600">-{row.getValue("sales")}</div>
      ),
    },
    {
      accessorKey: "adjustments",
      header: "Adjustments",
      cell: ({ row }: any) => {
        const adjustments = row.getValue("adjustments") as number
        return (
          <div className="text-center">
            {adjustments > 0 ? `+${adjustments}` : adjustments < 0 ? adjustments.toString() : "0"}
          </div>
        )
      },
    },
    {
      accessorKey: "closingStock",
      header: "Closing Stock",
      cell: ({ row }: any) => {
        const stock = row.getValue("closingStock") as number
        return (
          <div className="flex items-center space-x-2">
            <span className="font-medium">{stock}</span>
            {stock <= 5 && stock > 0 && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
            {stock === 0 && <AlertTriangle className="h-4 w-4 text-red-500" />}
          </div>
        )
      },
    },
    {
      accessorKey: "product.purchasePrice",
      header: "Unit Cost",
      cell: ({ row }: any) => {
        const cost = row.original.product.purchasePrice
        return (
          <div className="text-right">
            ₹{cost.toLocaleString()}
          </div>
        )
      },
    },
    {
      accessorKey: "stockValue",
      header: "Stock Value",
      cell: ({ row }: any) => {
        const value = Number.parseFloat(row.getValue("stockValue"))
        return (
          <div className="font-medium text-right">
            ₹{value.toLocaleString()}
          </div>
        )
      },
    },
  ]

  const categories = Array.from(new Set(stockData?.items.map(item => item.product.category) || []))

  return (
    <DashboardLayout
      title="Stock Statement"
      headerActions={
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!stockData}>
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

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{totalValue.toLocaleString()}
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
              <div className="text-2xl font-bold">{totalQuantity}</div>
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
            <CardDescription>
              Current stock levels and valuation for all products
              {stockData && ` as of ${new Date(stockData.asOfDate).toLocaleDateString()}`}
            </CardDescription>
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
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={loadStockStatement}>
                <Filter className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Loading stock statement...</p>
                </div>
              </div>
            ) : (
              <DataTable columns={columns} data={filteredStock} />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}