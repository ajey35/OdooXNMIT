"use client"
import React from "react"
import { Button } from "../ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { FileText, Receipt, ShoppingCart, Users, Package } from "lucide-react"
import { useRouter } from "next/navigation"

export function QuickActions() {
  const router = useRouter()

  const actions = [
    {
      title: "New Invoice",
      description: "Create customer invoice",
      icon: FileText,
      href: "/sales/invoices",
      color: "bg-blue-500",
    },
    {
      title: "New Bill",
      description: "Record vendor bill",
      icon: Receipt,
      href: "/purchase/bills",
      color: "bg-green-500",
    },
    {
      title: "New Order",
      description: "Create purchase order",
      icon: ShoppingCart,
      href: "/purchase/orders",
      color: "bg-orange-500",
    },
    {
      title: "Add Contact",
      description: "New customer/vendor",
      icon: Users,
      href: "/master/contacts",
      color: "bg-purple-500",
    },
    {
      title: "Add Product",
      description: "New product/service",
      icon: Package,
      href: "/master/products",
      color: "bg-pink-500",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Frequently used actions for faster workflow</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {actions.map((action) => (
            <Button
              key={action.title}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-accent bg-transparent"
              onClick={() => router.push(action.href)}
            >
              <div className={`p-2 rounded-lg ${action.color} text-white`}>
                <action.icon className="h-4 w-4" />
              </div>
              <div className="text-center">
                <div className="text-sm font-medium">{action.title}</div>
                <div className="text-xs text-muted-foreground">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
