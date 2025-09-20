"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2 } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import { apiClient } from "@/lib/api"

interface ChartOfAccount {
  id: string
  name: string
  type: "ASSET" | "LIABILITY" | "EXPENSE" | "INCOME" | "EQUITY"
  code: string
  parentId?: string
  createdAt: string
}

const columns: ColumnDef<ChartOfAccount>[] = [
  {
    accessorKey: "code",
    header: "Code",
  },
  {
    accessorKey: "name",
    header: "Account Name",
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as string
      const variant =
        type === "ASSET"
          ? "default"
          : type === "LIABILITY"
            ? "destructive"
            : type === "INCOME"
              ? "default"
              : type === "EXPENSE"
                ? "secondary"
                : "outline"
      return <Badge variant={variant}>{type}</Badge>
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      return (
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon">
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

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      const response = await apiClient.getChartOfAccounts()
      setAccounts(response.data || [])
    } catch (error) {
      console.error("Failed to load accounts:", error)
      // Mock data for demo
      setAccounts([
        {
          id: "1",
          name: "Cash Account",
          type: "ASSET",
          code: "1001",
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          name: "Bank Account",
          type: "ASSET",
          code: "1002",
          createdAt: new Date().toISOString(),
        },
        {
          id: "3",
          name: "Debtors Account",
          type: "ASSET",
          code: "1003",
          createdAt: new Date().toISOString(),
        },
        {
          id: "4",
          name: "Creditors Account",
          type: "LIABILITY",
          code: "2001",
          createdAt: new Date().toISOString(),
        },
        {
          id: "5",
          name: "Sales Income Account",
          type: "INCOME",
          code: "3001",
          createdAt: new Date().toISOString(),
        },
        {
          id: "6",
          name: "Purchase Expense Account",
          type: "EXPENSE",
          code: "4001",
          createdAt: new Date().toISOString(),
        },
        {
          id: "7",
          name: "Other Expense Account",
          type: "EXPENSE",
          code: "4002",
          createdAt: new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout
      title="Chart of Accounts"
      headerActions={
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Account
        </Button>
      }
    >
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading accounts...</p>
            </div>
          </div>
        ) : (
          <DataTable columns={columns} data={accounts} searchKey="name" searchPlaceholder="Search accounts..." />
        )}
      </div>
    </DashboardLayout>
  )
}
