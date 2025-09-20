"use client"

import React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Search, Bell, Settings } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"

interface HeaderProps {
  title?: string
  children?: React.ReactNode
}

export function Header({ title, children }: HeaderProps) {
  const pathname = usePathname()

  const generateBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean)
    const breadcrumbs = []

    // Always start with Dashboard
    breadcrumbs.push({
      label: "Dashboard",
      href: "/dashboard",
      isLast: segments.length === 1 && segments[0] === "dashboard",
    })

    // Generate breadcrumbs based on path segments
    let currentPath = ""
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`

      if (segment === "dashboard") return // Skip dashboard as it's already added

      let label = segment

      // Convert segment to readable label
      switch (segment) {
        case "master":
          label = "Master Data"
          break
        case "contacts":
          label = "Contact Master"
          break
        case "products":
          label = "Product Master"
          break
        case "taxes":
          label = "Tax Master"
          break
        case "accounts":
          label = "Chart of Accounts"
          break
        case "purchase":
          label = "Purchase"
          break
        case "sales":
          label = "Sales"
          break
        case "orders":
          label = "Orders"
          break
        case "bills":
          label = "Bills"
          break
        case "invoices":
          label = "Invoices"
          break
        case "payments":
          label = "Payments"
          break
        case "reports":
          label = "Reports"
          break
        case "balance-sheet":
          label = "Balance Sheet"
          break
        case "profit-loss":
          label = "Profit & Loss"
          break
        case "partner-ledger":
          label = "Partner Ledger"
          break
        default:
          label = segment.charAt(0).toUpperCase() + segment.slice(1)
      }

      breadcrumbs.push({
        label,
        href: currentPath,
        isLast: index === segments.length - 1,
      })
    })

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center space-x-4">
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((breadcrumb, index) => (
              <React.Fragment key={breadcrumb.href}>
                <BreadcrumbItem>
                  {breadcrumb.isLast ? (
                    <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={breadcrumb.href}>{breadcrumb.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search..." className="w-64 pl-9" />
        </div>

        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="icon">
          <Settings className="h-4 w-4" />
        </Button>

        {children}
      </div>
    </header>
  )
}
