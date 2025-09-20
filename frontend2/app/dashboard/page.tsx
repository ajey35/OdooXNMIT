"use client"

import React, { useEffect, useState } from "react"
import { DashboardLayout } from "../../components/layout/dashboard-layout"
import { ProtectedRoute } from "../../components/auth/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { apiClient } from "../../lib/api"
import { BarChart3, ShoppingCart, Receipt, TrendingUp, ArrowUpRight } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../../components/ui/chart"

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

// Mock chart data
const salesChartData = [
  { month: "Jan", sales: 85000, purchases: 65000 },
  { month: "Feb", sales: 92000, purchases: 70000 },
  { month: "Mar", sales: 78000, purchases: 58000 },
  { month: "Apr", sales: 105000, purchases: 75000 },
  { month: "May", sales: 118000, purchases: 82000 },
  { month: "Jun", sales: 125000, purchases: 85000 },
]

const profitChartData = [
  { month: "Jan", profit: 20000 },
  { month: "Feb", profit: 22000 },
  { month: "Mar", profit: 20000 },
  { month: "Apr", profit: 30000 },
  { month: "May", profit: 36000 },
  { month: "Jun", profit: 40000 },
]

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

  return (
    <ProtectedRoute>
      <DashboardLayout title="Dashboard">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6">
        {/* Overview Cards */}
        <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Monthly Sales</CardTitle>
              <div className="flex items-center space-x-1">
                <ArrowUpRight className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
                <BarChart3 className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold">{formatCurrency(stats?.sales.monthly.amount || 0)}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <span className="text-green-500 mr-1">+12%</span>
                <span className="hidden sm:inline">{stats?.sales.monthly.count || 0} invoices this month</span>
                <span className="sm:hidden">{stats?.sales.monthly.count || 0} invoices</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Monthly Purchases</CardTitle>
              <div className="flex items-center space-x-1">
                <ArrowUpRight className="h-3 w-3 md:h-4 md:w-4 text-orange-500" />
                <ShoppingCart className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold">
                {formatCurrency(stats?.purchases.monthly.amount || 0)}
              </div>
              <p className="text-xs text-muted-foreground flex items-center">
                <span className="text-orange-500 mr-1">+8%</span>
                <span className="hidden sm:inline">{stats?.purchases.monthly.count || 0} bills this month</span>
                <span className="sm:hidden">{stats?.purchases.monthly.count || 0} bills</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Monthly Profit</CardTitle>
              <div className="flex items-center space-x-1">
                <ArrowUpRight className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
                <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold">{formatCurrency(stats?.profit.monthly || 0)}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <span className="text-green-500 mr-1">+18%</span>
                <span className="hidden sm:inline">from last month</span>
                <span className="sm:hidden">vs last month</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Total Revenue</CardTitle>
              <Receipt className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold">{formatCurrency(stats?.sales.total.amount || 0)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="hidden sm:inline">{stats?.sales.total.count || 0} total invoices</span>
                <span className="sm:hidden">{stats?.sales.total.count || 0} invoices</span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-3 md:gap-4 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Sales vs Purchases</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Monthly comparison of sales and purchase amounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  sales: {
                    label: "Sales",
                    color: "hsl(var(--chart-1))",
                  },
                  purchases: {
                    label: "Purchases",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[250px] md:h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="sales" stroke="var(--color-sales)" strokeWidth={2} name="Sales" />
                    <Line
                      type="monotone"
                      dataKey="purchases"
                      stroke="var(--color-purchases)"
                      strokeWidth={2}
                      name="Purchases"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Monthly Profit Trend</CardTitle>
              <CardDescription className="text-xs md:text-sm">Profit margins over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  profit: {
                    label: "Profit",
                    color: "hsl(var(--chart-3))",
                  },
                }}
                className="h-[250px] md:h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profitChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="profit" fill="var(--color-profit)" name="Profit" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-3 md:gap-4 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Recent Sales</CardTitle>
              <CardDescription className="text-xs md:text-sm">Latest customer invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 md:space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 md:space-x-3">
                      <div className="h-6 w-6 md:h-8 md:w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Receipt className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs md:text-sm font-medium">INV-2024-{1000 + i}</p>
                        <p className="text-xs text-muted-foreground">Customer {i}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs md:text-sm font-medium">₹{(Math.random() * 50000 + 10000).toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">Today</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Recent Purchases</CardTitle>
              <CardDescription className="text-xs md:text-sm">Latest vendor bills</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 md:space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 md:space-x-3">
                      <div className="h-6 w-6 md:h-8 md:w-8 rounded-full bg-secondary/10 flex items-center justify-center">
                        <ShoppingCart className="h-3 w-3 md:h-4 md:w-4 text-secondary-foreground" />
                      </div>
                      <div>
                        <p className="text-xs md:text-sm font-medium">BILL-2024-{2000 + i}</p>
                        <p className="text-xs text-muted-foreground">Vendor {i}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs md:text-sm font-medium">₹{(Math.random() * 30000 + 5000).toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">Today</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}
