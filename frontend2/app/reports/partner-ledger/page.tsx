"use client"

import React, { useState, useEffect } from "react"
import { DashboardLayout } from "../../../components/layout/dashboard-layout"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { DataTable } from "../../../components/ui/data-table"
import { Badge } from "../../../components/ui/badge"
import { Calendar, Download, Printer, Search } from "lucide-react"
import { apiClient } from "../../../lib/api"
import { useToast } from "../../../hooks/use-toast"
import type { ColumnDef } from "@tanstack/react-table"

// ------------------- Types -------------------
interface PartnerLedgerEntry {
  id: string
  date: string
  partnerName: string
  partnerId: string
  referenceType: string
  referenceNumber: string
  description: string
  debitAmount: number
  creditAmount: number
  balance: number
}

interface PartnerLedgerData {
  partner: {
    id: string
    name: string
    type: string
  }
  entries: PartnerLedgerEntry[]
  openingBalance: number
  closingBalance: number
  totalDebit: number
  totalCredit: number
}

// ------------------- Table Columns -------------------
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
    accessorKey: "debitAmount",
    header: "Debit",
    cell: ({ row }) => {
      const amount = row.getValue("debitAmount") as number
      return amount > 0 ? `₹${amount.toLocaleString()}` : "-"
    },
  },
  {
    accessorKey: "creditAmount",
    header: "Credit",
    cell: ({ row }) => {
      const amount = row.getValue("creditAmount") as number
      return amount > 0 ? `₹${amount.toLocaleString()}` : "-"
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
]

// ------------------- Page Component -------------------
export default function PartnerLedgerPage() {
  const [ledgerData, setLedgerData] = useState<PartnerLedgerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
  )
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0])
  const [selectedPartner, setSelectedPartner] = useState<string>("")
  const { toast } = useToast()

  useEffect(() => {
    loadContacts()
  }, [])

  useEffect(() => {
    if (selectedPartner) {
      loadPartnerLedger()
    }
  }, [selectedPartner, startDate, endDate])

  const loadContacts = async () => {
    try {
    } catch (error) {
      console.error("Failed to load partner ledger:", error)
      toast({
        title: "Error",
        description: "Failed to load partner ledger",
        variant: "destructive",
      })
      // Set mock data for demo
      setLedgerData({
        partner: {
          id: selectedPartner,
          name: contacts.find(c => c.id === selectedPartner)?.name || "Unknown Partner",
          type: "CUSTOMER"
        },
        entries: [
          {
            id: "1",
            date: startDate,
            partnerName: contacts.find(c => c.id === selectedPartner)?.name || "Unknown Partner",
            partnerId: selectedPartner,
            referenceType: "INVOICE",
            referenceNumber: "INV-2024-001",
            description: "Sales Invoice",
            debitAmount: 0,
            creditAmount: 88500,
            balance: 88500,
          },
          {
            id: "2",
            date: endDate,
            partnerName: contacts.find(c => c.id === selectedPartner)?.name || "Unknown Partner",
            partnerId: selectedPartner,
            referenceType: "PAYMENT",
            referenceNumber: "PAY-2024-001",
            description: "Payment Received",
            debitAmount: 88500,
            creditAmount: 0,
            balance: 0,
          },
        ],
        openingBalance: 0,
        closingBalance: 0,
        totalDebit: 88500,
        totalCredit: 88500,
      })
    } finally {
      setLoading(false)
    }
  }

      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount)

  return (
    <DashboardLayout
      title="Partner Ledger"
      headerActions={
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!ledgerData}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* ------------------- Filters ------------------- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="mr-2 h-5 w-5" />
              Filter Options
            </CardTitle>
          </CardHeader>
          <CardContent>
                <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select partner" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.name} ({contact.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input 
                  id="startDate" 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input 
                  id="endDate" 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                />
              </div>
              <div className="flex items-end">
                <Button onClick={loadPartnerLedger} className="w-full" disabled={!selectedPartner}>
                  Generate Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>


              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Opening Balance</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(ledgerData.openingBalance)}</div>
                  <p className="text-xs text-muted-foreground">As of {new Date(startDate).toLocaleDateString()}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Debit</CardTitle>
                  <Calendar className="h-4 w-4 text-red-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-400">{formatCurrency(ledgerData.totalDebit)}</div>
                  <p className="text-xs text-muted-foreground">Debit transactions</p>
                </CardContent>
              </Card>

                </div>
              </CardContent>
            </Card>
          </>
        )}

        {!selectedPartner && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center p-8">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a Partner</h3>
                <p className="text-muted-foreground">
                  Choose a partner from the dropdown above to view their ledger entries.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}