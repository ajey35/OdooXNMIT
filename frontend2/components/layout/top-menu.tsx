"use client"
import React from "react"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "../ui/navigation-menu"
import { cn } from "../../lib/utils"
import Link from "next/link"
import { ShoppingCart, Receipt, CreditCard, FileText, BarChart3, PieChart, TrendingUp } from "lucide-react"

export function TopMenu() {
  return (
    <div className="border-b border-border bg-card">
      <div className="container mx-auto px-6">
        <NavigationMenu>
          <NavigationMenuList className="space-x-1">
            <NavigationMenuItem>
              <NavigationMenuTrigger className="h-12 px-4 text-sm font-medium">Purchase</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="grid w-[300px] gap-3 p-4">
                  <NavigationMenuLink asChild>
                    <Link
                      href="/purchase/orders"
                      className={cn(
                        "flex items-center space-x-3 rounded-md p-3 text-sm leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                      )}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Purchase Order</div>
                        <p className="text-xs text-muted-foreground">Create and manage purchase orders</p>
                      </div>
                    </Link>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                    <Link
                      href="/purchase/bills"
                      className={cn(
                        "flex items-center space-x-3 rounded-md p-3 text-sm leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                      )}
                    >
                      <FileText className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Purchase Bill</div>
                        <p className="text-xs text-muted-foreground">Record vendor bills and expenses</p>
                      </div>
                    </Link>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                    <Link
                      href="/purchase/payments"
                      className={cn(
                        "flex items-center space-x-3 rounded-md p-3 text-sm leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                      )}
                    >
                      <CreditCard className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Payment</div>
                        <p className="text-xs text-muted-foreground">Make payments to vendors</p>
                      </div>
                    </Link>
                  </NavigationMenuLink>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger className="h-12 px-4 text-sm font-medium">Sale</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="grid w-[300px] gap-3 p-4">
                  <NavigationMenuLink asChild>
                    <Link
                      href="/sales/orders"
                      className={cn(
                        "flex items-center space-x-3 rounded-md p-3 text-sm leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                      )}
                    >
                      <Receipt className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Sale Order</div>
                        <p className="text-xs text-muted-foreground">Create and manage sales orders</p>
                      </div>
                    </Link>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                    <Link
                      href="/sales/invoices"
                      className={cn(
                        "flex items-center space-x-3 rounded-md p-3 text-sm leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                      )}
                    >
                      <FileText className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Sale Invoice</div>
                        <p className="text-xs text-muted-foreground">Generate customer invoices</p>
                      </div>
                    </Link>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                    <Link
                      href="/sales/payments"
                      className={cn(
                        "flex items-center space-x-3 rounded-md p-3 text-sm leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                      )}
                    >
                      <CreditCard className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Receipt</div>
                        <p className="text-xs text-muted-foreground">Record customer payments</p>
                      </div>
                    </Link>
                  </NavigationMenuLink>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger className="h-12 px-4 text-sm font-medium">Report</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="grid w-[300px] gap-3 p-4">
                  <NavigationMenuLink asChild>
                    <Link
                      href="/reports/profit-loss"
                      className={cn(
                        "flex items-center space-x-3 rounded-md p-3 text-sm leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                      )}
                    >
                      <TrendingUp className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Profit & Loss</div>
                        <p className="text-xs text-muted-foreground">View income and expense reports</p>
                      </div>
                    </Link>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                    <Link
                      href="/reports/balance-sheet"
                      className={cn(
                        "flex items-center space-x-3 rounded-md p-3 text-sm leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                      )}
                    >
                      <BarChart3 className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Balance Sheet</div>
                        <p className="text-xs text-muted-foreground">View assets and liabilities</p>
                      </div>
                    </Link>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                    <Link
                      href="/reports/stock-statement"
                      className={cn(
                        "flex items-center space-x-3 rounded-md p-3 text-sm leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                      )}
                    >
                      <PieChart className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Stock Statement</div>
                        <p className="text-xs text-muted-foreground">View inventory reports</p>
                      </div>
                    </Link>
                  </NavigationMenuLink>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  )
}
