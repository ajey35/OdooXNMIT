"use client"

import React, { useState } from "react"

import { Button } from "../ui/button"
import { Input } from "../ui/input"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { Search, Bell, Settings, User, LogOut, Menu } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { ThemeToggle } from "../theme-toggle"
import { useAuth } from "../../lib/auth"

interface HeaderProps {
  title?: string
  children?: React.ReactNode
  onMenuClick?: () => void
}

export function Header({ title, children, onMenuClick }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout, user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      console.log("[v0] Searching for:", searchQuery)
    }
  }

  const handleSettingsClick = (action: string) => {
    console.log(`[v0] Settings action: ${action}`)
    switch (action) {
      case "profile":
        router.push("/profile")
        break
      case "settings":
        router.push("/settings")
        break
      case "logout":
        console.log("Logging out from header")
        logout().then(() => {
          // Use replace instead of push to prevent back navigation to authenticated pages
          router.replace("/auth/login")
        })
        break
    }
  }

  const handleNotificationsClick = () => {
    console.log("[v0] Notifications clicked")
    router.push("/notifications")
  }

  const breadcrumbs = generateBreadcrumbs()

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-3 md:px-6 shadow-sm">
      <div className="flex items-center space-x-2 md:space-x-4">
        <Button variant="ghost" size="icon" className="h-9 w-9 lg:hidden" onClick={onMenuClick}>
          <Menu className="h-4 w-4" />
        </Button>

        <div className="flex items-center space-x-2 md:space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            SA
          </div>
          <span className="font-semibold text-base md:text-lg hidden sm:block">Shiv Accounts</span>
        </div>

        <div className="h-6 w-px bg-border hidden md:block" />

        <div className="hidden sm:block">
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((breadcrumb, index) => (
                <React.Fragment key={breadcrumb.href}>
                  <BreadcrumbItem>
                    {breadcrumb.isLast ? (
                      <BreadcrumbPage className="text-sm">{breadcrumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={breadcrumb.href} className="text-sm">
                          {breadcrumb.label}
                        </Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <div className="flex items-center space-x-1 md:space-x-3">
        <form onSubmit={handleSearch} className="relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search transactions, contacts..."
            className="w-48 xl:w-64 pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        <Button variant="ghost" size="icon" className="h-9 w-9 lg:hidden">
          <Search className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleNotificationsClick}>
          <Bell className="h-4 w-4" />
        </Button>

        <div className="hidden sm:block">
          <ThemeToggle />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.name || "User"}</p>
              <p className="text-xs text-muted-foreground">{user?.email || "user@example.com"}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleSettingsClick("profile")}>
              <User className="mr-2 h-4 w-4" />
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSettingsClick("settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Application Settings
            </DropdownMenuItem>
            <div className="sm:hidden">
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Theme</span>
                  <ThemeToggle />
                </div>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleSettingsClick("logout")}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {children}
      </div>
    </header>
  )
}

interface BreadcrumbItem {
  label: string
  href: string
  isLast: boolean
}

function generateBreadcrumbs(): BreadcrumbItem[] {
  const segments = window.location.pathname.split("/").filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = []

  breadcrumbs.push({
    label: "Dashboard",
    href: "/dashboard",
    isLast: segments.length === 1 && segments[0] === "dashboard",
  })

  let currentPath = ""
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`

    if (segment === "dashboard") return

    let label = segment

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
