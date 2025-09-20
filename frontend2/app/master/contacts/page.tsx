"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "../../../components/layout/dashboard-layout"
import { Button } from "../../../components/ui/button"
import { DataTable } from "../../../components/ui/data-table"
import { Badge } from "../../../components/ui/badge"
import { ContactForm } from "../../../components/forms/contact-form"
import { Plus, Edit, Trash2 } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import { apiClient } from "../../../lib/api"
import React from "react"

interface Contact {
  id: string
  name: string
  type: "CUSTOMER" | "VENDOR" | "BOTH"
  email: string
  mobile: string
  city: string
  state: string
  createdAt: string
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)

  const columns: ColumnDef<Contact>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("type") as string
        return (
          <Badge variant={type === "CUSTOMER" ? "default" : type === "VENDOR" ? "secondary" : "outline"}>{type}</Badge>
        )
      },
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "mobile",
      header: "Mobile",
    },
    {
      accessorKey: "city",
      header: "City",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const contact = row.original
        return (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditingContact(contact)
                setShowForm(true)
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleDelete(contact.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = async () => {
    try {
      const response = await apiClient.getContacts()
      setContacts(response.data || [])
    } catch (error) {
      console.error("Failed to load contacts:", error)
      // Mock data for demo
      setContacts([
        {
          id: "1",
          name: "Azure Furniture",
          type: "VENDOR",
          email: "contact@azure-furniture.com",
          mobile: "+91 9876543210",
          city: "Mumbai",
          state: "Maharashtra",
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          name: "Nimesh Pathak",
          type: "CUSTOMER",
          email: "nimesh@example.com",
          mobile: "+91 9876543211",
          city: "Delhi",
          state: "Delhi",
          createdAt: new Date().toISOString(),
        },
        {
          id: "3",
          name: "Global Suppliers",
          type: "BOTH",
          email: "info@globalsuppliers.com",
          mobile: "+91 9876543212",
          city: "Bangalore",
          state: "Karnataka",
          createdAt: new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this contact?")) {
      try {
        await apiClient.deleteContact(id)
        loadContacts()
      } catch (error) {
        console.error("Failed to delete contact:", error)
      }
    }
  }

  const handleFormSuccess = () => {
    loadContacts()
    setEditingContact(null)
  }

  return (
    <DashboardLayout
      title="Contact Master"
      headerActions={
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Contact
        </Button>
      }
    >
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading contacts...</p>
            </div>
          </div>
        ) : (
          <DataTable columns={columns} data={contacts} searchKey="name" searchPlaceholder="Search contacts..." />
        )}

        <ContactForm
          open={showForm}
          onOpenChange={(open) => {
            setShowForm(open)
            if (!open) setEditingContact(null)
          }}
          contact={editingContact}
          onSuccess={handleFormSuccess}
        />
      </div>
    </DashboardLayout>
  )
}
