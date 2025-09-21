"use client"
import React from "react"
import { useState, useEffect } from "react"
import { DashboardLayout } from "../../../components/layout/dashboard-layout"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Separator } from "../../../components/ui/separator"
import { Calendar, Download, Printer } from "lucide-react"
import { apiClient } from "../../../lib/api"

interface BalanceSheetItem {
  name: string
  amount: number
  children?: BalanceSheetItem[]
}

interface BalanceSheetData {
  asOfDate: string
  assets: {
    items: BalanceSheetItem[]
    total: number
  }
  liabilities: {
    items: BalanceSheetItem[]
    total: number
  }
  equity: {
    items: BalanceSheetItem[]
    total: number
  }
  totalLiabilitiesAndEquity: number
  isBalanced: boolean
}

export default function BalanceSheetPage() {
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split("T")[0])

  useEffect(() => {
    loadBalanceSheet()
  }, [])

  const loadBalanceSheet = async () => {
    try {
      const response = await apiClient.getBalanceSheet(asOfDate)
      setBalanceSheet(response.data)
    } catch (error) {
      console.error("Failed to load balance sheet:", error)
      // Mock data for demo
      setBalanceSheet({
        asOfDate: asOfDate,
        assets: {
          items: [
            {
              name: "Current Assets",
              amount: 0,
              children: [
                { name: "Cash Account", amount: 150000 },
                { name: "Bank Account", amount: 500000 },
                { name: "Debtors Account", amount: 250000 },
              ],
            },
            {
              name: "Fixed Assets",
              amount: 0,
              children: [
                { name: "Office Equipment", amount: 200000 },
                { name: "Furniture & Fixtures", amount: 150000 },
              ],
            },
          ],
          total: 1250000,
        },
        liabilities: {
          items: [
            {
              name: "Current Liabilities",
              amount: 0,
              children: [
                { name: "Creditors Account", amount: 180000 },
                { name: "Tax Payable", amount: 45000 },
              ],
            },
            { name: "Long Term Liabilities", amount: 0, children: [{ name: "Bank Loan", amount: 300000 }] },
          ],
          total: 525000,
        },
        equity: {
          items: [
            { name: "Owner's Equity", amount: 500000 },
            { name: "Retained Earnings", amount: 225000 },
          ],
          total: 725000,
        },
        totalLiabilitiesAndEquity: 1250000,
        isBalanced: true,
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

  const handlePrint = () => {
    window.print()
  }

  const handleExport = () => {
    if (!balanceSheet) return

    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Category,Account,Amount\n" +
      balanceSheet.assets.items.flatMap(item => 
        item.children ? 
          item.children.map(child => `Assets,${child.name},${child.amount}`) :
          [`Assets,${item.name},${item.amount}`]
      ).concat(
        balanceSheet.liabilities.items.flatMap(item => 
          item.children ? 
            item.children.map(child => `Liabilities,${child.name},${child.amount}`) :
            [`Liabilities,${item.name},${item.amount}`]
        )
      ).concat(
        balanceSheet.equity.items.map(item => `Equity,${item.name},${item.amount}`)
      ).join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "balance_sheet.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const renderBalanceSheetSection = (title: string, items: BalanceSheetItem[], total: number) => (
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
        <span className="font-mono">{formatCurrency(total)}</span>
      </div>
    </div>
  )

  return (
    <DashboardLayout
      title="Balance Sheet"
      headerActions={
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!balanceSheet}>
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
                <Label htmlFor="asOfDate">As of Date</Label>
                <Input
                  id="asOfDate"
                  type="date"
                  value={asOfDate}
                  onChange={(e) => setAsOfDate(e.target.value)}
                  className="w-40"
                />
              </div>
              <Button onClick={loadBalanceSheet} className="mt-6">
                Generate Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Balance Sheet Report */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading balance sheet...</p>
            </div>
          </div>
        ) : balanceSheet ? (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Assets */}
            <Card>
              <CardHeader>
                <CardTitle>Assets</CardTitle>
                <CardDescription>As of {new Date(balanceSheet.asOfDate).toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent>
                {renderBalanceSheetSection("Assets", balanceSheet.assets.items, balanceSheet.assets.total)}
              </CardContent>
            </Card>

            {/* Liabilities & Equity */}
            <Card>
              <CardHeader>
                <CardTitle>Liabilities & Equity</CardTitle>
                <CardDescription>As of {new Date(balanceSheet.asOfDate).toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {renderBalanceSheetSection(
                  "Liabilities",
                  balanceSheet.liabilities.items,
                  balanceSheet.liabilities.total,
                )}
                {renderBalanceSheetSection("Equity", balanceSheet.equity.items, balanceSheet.equity.total)}
                <Separator className="my-4" />
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total Liabilities & Equity</span>
                  <span className="font-mono">{formatCurrency(balanceSheet.totalLiabilitiesAndEquity)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Balance Check */}
        {balanceSheet && (
          <Card>
            <CardContent className="pt-6">
              <div
                className={`text-center p-4 rounded-lg ${
                  balanceSheet.isBalanced
                    ? "bg-green-500/10 text-green-500 border border-green-500/20"
                    : "bg-red-500/10 text-red-500 border border-red-500/20"
                }`}
              >
                <div className="font-semibold">
                  {balanceSheet.isBalanced ? "✓ Balance Sheet is Balanced" : "⚠ Balance Sheet is Not Balanced"}
                </div>
                <div className="text-sm mt-1">
                  Assets: {formatCurrency(balanceSheet.assets.total)} | Liabilities & Equity:{" "}
                  {formatCurrency(balanceSheet.totalLiabilitiesAndEquity)}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
