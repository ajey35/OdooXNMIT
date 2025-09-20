"use client"
import React, { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog"
import { apiClient } from "../../lib/api"
import { useToast } from "../../hooks/use-toast"
import { Wand2 } from "lucide-react"

interface Account {
  id: string
  name: string
  type: "ASSET" | "LIABILITY" | "EXPENSE" | "INCOME" | "EQUITY"
  code: string
  parentId?: string
}

interface AccountFormProps {
  openDialog: boolean
  setOpenDialog: (open: boolean) => void
  onSuccess: () => void
  account?: Account | null
}

export function AccountForm({ openDialog, setOpenDialog, onSuccess, account }: AccountFormProps) {
  const [formData, setFormData] = useState({
    name: account?.name || "",
    type: account?.type || "ASSET",
    code: account?.code || "",
    parentId: account?.parentId || "",
  })
  const [loading, setLoading] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const { toast } = useToast()

  // Load accounts and reset form when dialog opens
  useEffect(() => {
    if (openDialog) {
      loadAccounts()
      setFormData({
        name: account?.name || "",
        type: account?.type || "ASSET",
        code: account?.code || "",
        parentId: account?.parentId || "",
      })
    }
  }, [openDialog, account])

  const loadAccounts = async () => {
    setLoadingAccounts(true)
    try {
      const response = await apiClient.getChartOfAccounts()
      setAccounts(response.data || [])
    } catch {
      setAccounts([])
    } finally {
      setLoadingAccounts(false)
    }
  }

  const getSuggestedCode = (type: string) => {
    const existingCodes = accounts
      .filter((acc) => acc.type === type)
      .map((acc) => parseInt(acc.code))
      .filter((c) => !isNaN(c))
      .sort((a, b) => a - b)
    if (existingCodes.length === 0) {
      return type === "ASSET"
        ? "1001"
        : type === "LIABILITY"
          ? "2001"
          : type === "INCOME"
            ? "3001"
            : type === "EXPENSE"
              ? "4001"
              : "5001"
    }
    return String(existingCodes[existingCodes.length - 1] + 1)
  }

  const handleTypeChange = (type: Account["type"]) => {
    setFormData((prev) => ({
      ...prev,
      type,
      code: prev.code || getSuggestedCode(type),
      parentId: "",
    }))
  }

  const validateForm = () => {
    if (!formData.code.trim() || !formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Code and Name are required",
        variant: "destructive",
      })
      return false
    }
    const existing = accounts.find((acc) => acc.code === formData.code && acc.id !== account?.id)
    if (existing) {
      toast({
        title: "Validation Error",
        description: "Code already exists",
        variant: "destructive",
      })
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    try {
      const accountData = {
        name: formData.name,
        type: formData.type,
        code: formData.code,
        parentId: formData.parentId || null,
      }

      if (account) {
        await apiClient.updateAccount(account.id, accountData)
        toast({ title: "Updated", description: "Account updated successfully" })
      } else {
        await apiClient.createAccount(accountData)
        toast({ title: "Created", description: "Account created successfully" })
      }
      onSuccess()
      setOpenDialog(false)
    } catch {
      toast({ title: "Error", description: "Failed to save account", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{account ? "Edit Account" : "Create Account"}</DialogTitle>
          <DialogDescription>
            {account
              ? "Update your account information."
              : "Add a new account to the chart of accounts."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Code */}
          <div className="space-y-2">
            <Label htmlFor="code">Account Code</Label>
            <div className="flex space-x-2">
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
                placeholder="e.g., 1001"
                required
                className="flex-1"
              />
              {!account && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData((prev) => ({ ...prev, code: getSuggestedCode(formData.type) }))}
                >
                  <Wand2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Account Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Account Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          {/* Account Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Account Type</Label>
            <Select value={formData.type} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                {["ASSET", "LIABILITY", "INCOME", "EXPENSE", "EQUITY"].map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Parent Account */}
          <div className="space-y-2">
            <Label htmlFor="parentId">Parent Account (Optional)</Label>
            <Select
              value={formData.parentId || "none"}
              onValueChange={(val) => setFormData((prev) => ({
                ...prev,
                parentId: val === "none" ? "" : val,
              }))}
              disabled={loadingAccounts}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingAccounts ? "Loading accounts..." : "Select parent account"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Parent</SelectItem>
                {accounts
                  .filter((acc) => acc.id !== account?.id && acc.type === formData.type)
                  .sort((a, b) => a.code.localeCompare(b.code))
                  .map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.code} - {acc.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>


          <DialogFooter className="flex space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : account ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}