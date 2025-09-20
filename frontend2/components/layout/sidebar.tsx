"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import { ScrollArea } from "../ui/scroll-area"
import { useAuth } from "../../lib/auth"
import {
  Users,
  Package,
  Receipt,
  FileText,
  ShoppingCart,
  CreditCard,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Home,
  LogOut,
  Building2,
} from "lucide-react"

interface NavItem {
  title: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  children?: NavItem[]
}

const navigation: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Master Data",
    icon: Settings,
    children: [
      {
        title: "Contact Master",
        href: "/master/contacts",
        icon: Users,
      },
      {
        title: "Product Master",
        href: "/master/products",
        icon: Package,
      },
      {
        title: "Tax Master",
        href: "/master/taxes",
        icon: Receipt,
      },
      {
        title: "Chart of Accounts",
        href: "/master/accounts",
        icon: Building2,
      },
    ],
  },
  {
    title: "Purchase",
    icon: ShoppingCart,
    children: [
      {
        title: "Purchase Orders",
        href: "/purchase/orders",
        icon: FileText,
      },
      {
        title: "Vendor Bills",
        href: "/purchase/bills",
        icon: Receipt,
      },
      {
        title: "Bill Payments",
        href: "/purchase/payments",
        icon: CreditCard,
      },
    ],
  },
  {
    title: "Sales",
    icon: BarChart3,
    children: [
      {
        title: "Sales Orders",
        href: "/sales/orders",
        icon: FileText,
      },
      {
        title: "Customer Invoices",
        href: "/sales/invoices",
        icon: Receipt,
      },
      {
        title: "Invoice Payments",
        href: "/sales/payments",
        icon: CreditCard,
      },
    ],
  },
  {
    title: "Reports",
    icon: BarChart3,
    children: [
      {
        title: "Balance Sheet",
        href: "/reports/balance-sheet",
        icon: FileText,
      },
      {
        title: "Profit & Loss",
        href: "/reports/profit-loss",
        icon: BarChart3,
      },
      {
        title: "Partner Ledger",
        href: "/reports/partner-ledger",
        icon: Users,
      },
    ],
  },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [expandedItems, setExpandedItems] = useState<string[]>(["Master Data"])

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) => (prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]))
  }

  const renderNavItem = (item: NavItem, level = 0) => {
    const isExpanded = expandedItems.includes(item.title)
    const hasChildren = item.children && item.children.length > 0
    const isActive = item.href ? pathname === item.href : false

    return (
      <div key={item.title}>
        {item.href ? (
          <Link href={item.href}>
            <Button
              variant={isActive ? "secondary" : "ghost"}
              className={cn("w-full justify-start", level > 0 && "ml-4 w-[calc(100%-1rem)]")}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.title}
            </Button>
          </Link>
        ) : (
          <Button
            variant="ghost"
            className={cn("w-full justify-start", level > 0 && "ml-4 w-[calc(100%-1rem)]")}
            onClick={() => hasChildren && toggleExpanded(item.title)}
          >
            <item.icon className="mr-2 h-4 w-4" />
            {item.title}
            {hasChildren && (
              <div className="ml-auto">
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            )}
          </Button>
        )}
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">{item.children!.map((child) => renderNavItem(child, level + 1))}</div>
        )}
      </div>
    )
  }

  return (
    <div className={cn("flex h-full w-64 flex-col bg-sidebar", className)}>
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <h1 className="text-lg font-semibold text-sidebar-foreground">Shiv Accounts Cloud</h1>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-2">{navigation.map((item) => renderNavItem(item))}</div>
      </ScrollArea>

      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-sidebar-primary flex items-center justify-center">
            <span className="text-sm font-medium text-sidebar-primary-foreground">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{user?.role?.replace("_", " ").toLowerCase()}</p>
          </div>
        </div>
        <Button variant="ghost" className="w-full justify-start text-sidebar-foreground" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}
