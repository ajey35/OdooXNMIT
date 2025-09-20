"use client"
import React, { useState } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Checkbox } from "../ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import { apiClient } from "../../lib/api"
import { useToast } from "../../hooks/use-toast"

interface TaxFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  tax?: {
    id: string
    name: string
    computationMethod: "PERCENTAGE" | "FIXED_VALUE"
    rate: number
    applicableOnSales: boolean
    applicableOnPurchase: boolean
  } | null
}

export function TaxForm({ isOpen, onClose, onSuccess, tax }: TaxFormProps) {
  const [formData, setFormData] = useState({
    name: tax?.name || "",
    computationMethod: tax?.computationMethod || "PERCENTAGE",
    rate: tax?.rate || 0,
    applicableOnSales: tax?.applicableOnSales ?? true,
    applicableOnPurchase: tax?.applicableOnPurchase ?? true,
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (tax) {
        await apiClient.updateTax(tax.id, formData)
        toast({
          title: "Success",
          description: "Tax updated successfully",
        })
      } else {
        await apiClient.createTax(formData)
        toast({
          title: "Success",
          description: "Tax created successfully",
        })
      }
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error saving tax:", error)
      toast({
        title: "Error",
        description: "Failed to save tax. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      name: tax?.name || "",
      computationMethod: tax?.computationMethod || "PERCENTAGE",
      rate: tax?.rate || 0,
      applicableOnSales: tax?.applicableOnSales ?? true,
      applicableOnPurchase: tax?.applicableOnPurchase ?? true,
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{tax ? "Edit Tax" : "Create New Tax"}</DialogTitle>
          <DialogDescription>
            {tax ? "Update the tax information below." : "Add a new tax to your system."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tax Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., GST 18%"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="computationMethod">Computation Method</Label>
            <Select
              value={formData.computationMethod}
              onValueChange={(value: "PERCENTAGE" | "FIXED_VALUE") =>
                setFormData((prev) => ({ ...prev, computationMethod: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                <SelectItem value="FIXED_VALUE">Fixed Value</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rate">
              Rate {formData.computationMethod === "PERCENTAGE" ? "(%)" : "(₹)"}
            </Label>
            <Input
              id="rate"
              type="number"
              step={formData.computationMethod === "PERCENTAGE" ? "0.01" : "1"}
              min="0"
              value={formData.rate}
              onChange={(e) => setFormData((prev) => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
              placeholder={formData.computationMethod === "PERCENTAGE" ? "18.00" : "500.00"}
              required
            />
          </div>

          <div className="space-y-4">
            <Label>Applicable On</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="applicableOnSales"
                  checked={formData.applicableOnSales}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, applicableOnSales: !!checked }))
                  }
                />
                <Label htmlFor="applicableOnSales">Sales</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="applicableOnPurchase"
                  checked={formData.applicableOnPurchase}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, applicableOnPurchase: !!checked }))
                  }
                />
                <Label htmlFor="applicableOnPurchase">Purchase</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleReset}>
              Reset
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : tax ? "Update Tax" : "Create Tax"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
