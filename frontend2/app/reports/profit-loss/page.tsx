"use client"
import React from "react"
import { useState, useEffect } from "react"
import { DashboardLayout } from "../../../components/layout/dashboard-layout"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Separator } from "../../../components/ui/separator"
import { Calendar, Download, Printer, TrendingUp, TrendingDown } from "lucide-react"
import { apiClient } from "../../../lib/api"

interface ProfitLossItem {
  name: string
  amount: number
  children?: ProfitLossItem[]
}

interface ProfitLossData {
  startDate: string
  endDate: string
  income: {
    items: ProfitLossItem[]
    total: number
  }
  expenses: {
    items: ProfitLossItem[]
    total: number
  }
  grossProfit: number
  netProfit: number
  profitMargin: number
}

export default function ProfitLossPage() {
  const [profitLoss, setProfitLoss] = useState<ProfitLossData | null>(null)
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
  )
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0])

  useEffect(() => {
    loadProfitLoss()
  }, [])

  const loadProfitLoss = async () => {
    try {
      const response = await apiClient.getProfitLoss(startDate, endDate)
      setProfitLoss(response.data)
    } catch (error) {
      console.error("Failed to load profit & loss:", error)
      // Mock data for demo
      setProfitLoss({
        startDate: startDate,
        endDate: endDate,
        income: {
          items: [
            { name: "Sales Revenue", amount: 850000 },
            { name: "Service Income", amount: 150000 },
            { name: "Other Income", amount: 25000 },
          ],
          total: 1025000,
        },
        expenses: {
          items: [
            { name: "Cost of Goods Sold", amount: 450000 },
            {
              name: "Operating Expenses",
              amount: 0,
              children: [
                { name: "Rent Expense", amount: 50000 },
                { name: "Salary Expense", amount: 200000 },
                { name: "Utilities", amount: 25000 },
                { name: "Marketing", amount: 35000 },
              ],
            },
            { name: "Other Expenses", amount: 15000 },
          ],
          total: 775000,
        },
        grossProfit: 575000,
        netProfit: 250000,
        profitMargin: 24.39,
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

  const renderProfitLossSection = (title: string, items: ProfitLossItem[], total: number, isExpense = false) => (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {items.map((item, index) => (
        <div key={index} className="space-y-1">
          {item.children ? (
            <>
              <div className="font-medium text-muted-foreground">{item.name}</div>
              {item.children.map((child, childIndex) => (
                <div key={childIndex} className="flex justify-between items-center pl-4">
                  <span className="text-sm">{child.name}</span>
                  <span className="text-sm font-mono">{formatCurrency(child.amount)}</span>
                </div>
              ))}
            </>
          ) : (
            <div className="flex justify-between items-center">
              <span>{item.name}</span>
              <span className="font-mono">{formatCurrency(item.amount)}</span>
            </div>
          )}
        </div>
      ))}
      <Separator />
      <div className="flex justify-between items-center font-semibold">
        <span>Total {title}</span>
        <span className={`font-mono ${isExpense ? "text-red-400" : "text-green-400"}`}>
          {isExpense ? `(${formatCurrency(total)})` : formatCurrency(total)}
        </span>
      </div>
    </div>
  )

  return (
    <DashboardLayout
      title="Profit & Loss Statement"
      headerActions={
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Date Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Report Parameters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-40"
                />
              </div>
              <Button onClick={loadProfitLoss} className="mt-6">
                Generate Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Profit & Loss Report */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading profit & loss statement...</p>
            </div>
          </div>
        ) : profitLoss ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-400">{formatCurrency(profitLoss.income.total)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-400">{formatCurrency(profitLoss.expenses.total)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                  <TrendingUp className={`h-4 w-4 ${profitLoss.netProfit >= 0 ? "text-green-400" : "text-red-400"}`} />
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${profitLoss.netProfit >= 0 ? "text-green-400" : "text-red-400"}`}
                  >
                    {formatCurrency(profitLoss.netProfit)}
                  </div>
                  <p className="text-xs text-muted-foreground">{profitLoss.profitMargin.toFixed(2)}% profit margin</p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Report */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Income */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-400">Income</CardTitle>
                  <CardDescription>
                    {new Date(profitLoss.startDate).toLocaleDateString()} -{" "}
                    {new Date(profitLoss.endDate).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderProfitLossSection("Income", profitLoss.income.items, profitLoss.income.total)}
                </CardContent>
              </Card>

              {/* Expenses */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-400">Expenses</CardTitle>
                  <CardDescription>
                    {new Date(profitLoss.startDate).toLocaleDateString()} -{" "}
                    {new Date(profitLoss.endDate).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderProfitLossSection("Expenses", profitLoss.expenses.items, profitLoss.expenses.total, true)}
                </CardContent>
              </Card>
            </div>

            {/* Net Profit Summary */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-lg">
                    <span>Total Income</span>
                    <span className="font-mono text-green-400">{formatCurrency(profitLoss.income.total)}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg">
                    <span>Total Expenses</span>
                    <span className="font-mono text-red-400">({formatCurrency(profitLoss.expenses.total)})</span>
                  </div>
                  <Separator />
                  <div
                    className={`flex justify-between items-center text-xl font-bold ${
                      profitLoss.netProfit >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    <span>Net {profitLoss.netProfit >= 0 ? "Profit" : "Loss"}</span>
                    <span className="font-mono">{formatCurrency(profitLoss.netProfit)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  )
}
