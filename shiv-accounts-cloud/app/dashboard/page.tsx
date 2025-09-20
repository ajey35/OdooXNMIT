"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api"
import { BarChart3, ShoppingCart, Receipt, TrendingUp } from "lucide-react"

interface DashboardStats {
  sales: {
    monthly: { amount: number; count: number }
    yearly: { amount: number; count: number }
    total: { amount: number; count: number }
  }
  purchases: {
    monthly: { amount: number; count: number }
    yearly: { amount: number; count: number }
    total: { amount: number; count: number }
  }
  profit: {
    monthly: number
    yearly: number
    total: number
  }
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardStats()
  }, [])

  const loadDashboardStats = async () => {
    try {
      const response = await apiClient.getDashboardStats()
      setStats(response.data)
    } catch (error) {
      console.error("Failed to load dashboard stats:", error)
      // Set mock data for demo
      setStats({
        sales: {
          monthly: { amount: 125000, count: 45 },
          yearly: { amount: 1250000, count: 520 },
          total: { amount: 2500000, count: 1200 },
        },
        purchases: {
          monthly: { amount: 85000, count: 32 },
          yearly: { amount: 850000, count: 380 },
          total: { amount: 1700000, count: 850 },
        },
        profit: {
          monthly: 40000,
          yearly: 400000,
          total: 800000,
        },
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Sales</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats?.sales.monthly.amount || 0)}</div>
              <p className="text-xs text-muted-foreground">{stats?.sales.monthly.count || 0} invoices this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Purchases</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats?.purchases.monthly.amount || 0)}</div>
              <p className="text-xs text-muted-foreground">{stats?.purchases.monthly.count || 0} bills this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Profit</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats?.profit.monthly || 0)}</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats?.sales.total.amount || 0)}</div>
              <p className="text-xs text-muted-foreground">{stats?.sales.total.count || 0} total invoices</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Sales</CardTitle>
              <CardDescription>Latest customer invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Receipt className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">INV-2024-{1000 + i}</p>
                        <p className="text-xs text-muted-foreground">Customer {i}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">₹{(Math.random() * 50000 + 10000).toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">Today</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Purchases</CardTitle>
              <CardDescription>Latest vendor bills</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center">
                        <ShoppingCart className="h-4 w-4 text-secondary-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">BILL-2024-{2000 + i}</p>
                        <p className="text-xs text-muted-foreground">Vendor {i}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">₹{(Math.random() * 30000 + 5000).toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">Today</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
