"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { TopMenu } from "./top-menu"
import { Sheet, SheetContent } from "../ui/sheet"

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  headerActions?: React.ReactNode
}

export function DashboardLayout({ children, title, headerActions }: DashboardLayoutProps) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)


  return (
    <div className="flex h-screen bg-background">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} onMenuClick={() => setSidebarOpen(true)}>
          {headerActions}
        </Header>
        <TopMenu />
        <main className="flex-1 overflow-auto p-3 md:p-6">{children}</main>
      </div>
    </div>
  )
}
