"use client"
import React from "react"
import { useState, useEffect } from "react"
import { DashboardLayout } from "../../../components/layout/dashboard-layout"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { DataTable } from "../../../components/ui/data-table"
import { Badge } from "../../../components/ui/badge"
import { Calendar, Download, Printer, Search } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"

interface PartnerLedgerEntry {
  id: string
  date: string
  partnerName: string
  accountNumber: string
  invoiceNumber: string
  dueDate: string
  amount: number
  balance: number
  type: "INVOICE" | "BILL" | "PAYMENT"
  status: "PAID" | "UNPAID" | "PARTIAL"
}

const columns: ColumnDef<PartnerLedgerEntry>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      const date = new Date(row.getValue("date"))
      return date.toLocaleDateString()
    },
  },
  {
    accessorKey: "partnerName",
    header: "Partner Name",
  },
  {
    accessorKey: "accountNumber",
    header: "Account No.",
  },
  {
    accessorKey: "invoiceNumber",
    header: "Invoice/Bill No.",
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
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const amount = row.getValue("amount") as number
      return `₹${amount.toLocaleString()}`
    },
  },
  {
    accessorKey: "balance",
    header: "Balance",
    cell: ({ row }) => {
      const balance = row.getValue("balance") as number
      return (
        <span className={balance > 0 ? "text-red-400" : balance < 0 ? "text-green-400" : ""}>
          ₹{Math.abs(balance).toLocaleString()}
        </span>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      const variant = status === "PAID" ? "default" : status === "PARTIAL" ? "secondary" : "destructive"
      return <Badge variant={variant}>{status}</Badge>
    },
  },
]

export default function PartnerLedgerPage() {
  const [ledgerEntries, setLedgerEntries] = useState<PartnerLedgerEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
  )
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0])
  const [selectedPartner, setSelectedPartner] = useState<string>("all")
  const [partnerType, setPartnerType] = useState<string>("all")

  useEffect(() => {
    loadPartnerLedger()
  }, [])

  const loadPartnerLedger = async () => {
    try {
      // This would be a real API call
      // const response = await apiClient.getPartnerLedger({ startDate, endDate, partner: selectedPartner, type: partnerType })
      // setLedgerEntries(response.data || [])

      // Mock data for demo
      setLedgerEntries([
        {
          id: "1",
          date: new Date().toISOString(),
          partnerName: "Azure Furniture",
          accountNumber: "2001",
          invoiceNumber: "BILL-2024-001",
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 59000,
          balance: 59000,
          type: "BILL",
          status: "UNPAID",
        },
        {
          id: "2",
          date: new Date().toISOString(),
          partnerName: "Nimesh Pathak",
          accountNumber: "1003",
          invoiceNumber: "INV-2024-001",
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 88500,
          balance: 0,
          type: "INVOICE",
          status: "PAID",
        },
        {
          id: "3",
          date: new Date().toISOString(),
          partnerName: "Global Suppliers",
          accountNumber: "2001",
          invoiceNumber: "BILL-2024-002",
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 29500,
          balance: 0,
          type: "BILL",
          status: "PAID",
        },
        {
          id: "4",
          date: new Date().toISOString(),
          partnerName: "Global Suppliers",
          accountNumber: "1003",
          invoiceNumber: "INV-2024-002",
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 53100,
          balance: 53100,
          type: "INVOICE",
          status: "UNPAID",
        },
      ])
    } catch (error) {
      console.error("Failed to load partner ledger:", error)
    } finally {
      setLoading(false)
    }
  }

  const totalOutstanding = ledgerEntries.reduce((sum, entry) => sum + (entry.balance > 0 ? entry.balance : 0), 0)
  const totalReceivables = ledgerEntries
    .filter((e) => e.type === "INVOICE" && e.balance > 0)
    .reduce((sum, entry) => sum + entry.balance, 0)
  const totalPayables = ledgerEntries
    .filter((e) => e.type === "BILL" && e.balance > 0)
    .reduce((sum, entry) => sum + entry.balance, 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <DashboardLayout
      title="Partner Ledger"
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
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="mr-2 h-5 w-5" />
              Filter Options
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Partner Type</Label>
                <Select value={partnerType} onValueChange={setPartnerType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Partners</SelectItem>
                    <SelectItem value="customer">Customers</SelectItem>
                    <SelectItem value="vendor">Vendors</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Specific Partner</Label>
                <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select partner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Partners</SelectItem>
                    <SelectItem value="azure">Azure Furniture</SelectItem>
                    <SelectItem value="nimesh">Nimesh Pathak</SelectItem>
                    <SelectItem value="global">Global Suppliers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={loadPartnerLedger} className="w-full">
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalOutstanding)}</div>
              <p className="text-xs text-muted-foreground">All unpaid amounts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accounts Receivable</CardTitle>
              <Calendar className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{formatCurrency(totalReceivables)}</div>
              <p className="text-xs text-muted-foreground">Customer outstanding</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accounts Payable</CardTitle>
              <Calendar className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">{formatCurrency(totalPayables)}</div>
              <p className="text-xs text-muted-foreground">Vendor outstanding</p>
            </CardContent>
          </Card>
        </div>

        {/* Partner Ledger Table */}
        <Card>
          <CardHeader>
            <CardTitle>Partner Ledger Entries</CardTitle>
            <CardDescription>
              Showing entries from {new Date(startDate).toLocaleDateString()} to{" "}
              {new Date(endDate).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Loading partner ledger...</p>
                </div>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={ledgerEntries}
                searchKey="partnerName"
                searchPlaceholder="Search partners..."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
