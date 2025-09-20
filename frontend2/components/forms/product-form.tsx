"use client"

import React from "react"

import { useState } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog"
import { Alert, AlertDescription } from "../ui/alert"
import { Loader2 } from "lucide-react"
import { apiClient } from "../../lib/api"

interface ProductFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: any
  onSuccess: () => void
}

export function ProductForm({ open, onOpenChange, product, onSuccess }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: product?.name || "",
    type: product?.type || "GOODS",
    category: product?.category || "",
    hsnCode: product?.hsnCode || "",
    salesPrice: product?.salesPrice || "",
    purchasePrice: product?.purchasePrice || "",
    salesTaxPercent: product?.salesTaxPercent || "",
    purchaseTaxPercent: product?.purchaseTaxPercent || "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const productData = {
        ...formData,
        salesPrice: Number.parseFloat(formData.salesPrice) || 0,
        purchasePrice: Number.parseFloat(formData.purchasePrice) || 0,
        salesTaxPercent: Number.parseFloat(formData.salesTaxPercent) || 0,
        purchaseTaxPercent: Number.parseFloat(formData.purchaseTaxPercent) || 0,
      }

      if (product) {
        await apiClient.updateProduct(product.id, productData)
      } else {
        await apiClient.createProduct(productData)
      }
      onSuccess()
      onOpenChange(false)
      setFormData({
        name: "",
        type: "GOODS",
        category: "",
        hsnCode: "",
        salesPrice: "",
        purchasePrice: "",
        salesTaxPercent: "",
        purchaseTaxPercent: "",
      })
    } catch (error: any) {
      setError(error.message || "Failed to save product")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "New Product"}</DialogTitle>
          <DialogDescription>
            {product ? "Update product information" : "Add a new product to your catalog"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Enter product name"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Product Type *</Label>
              <Select value={formData.type} onValueChange={(value) => handleChange("type", value)} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GOODS">Goods</SelectItem>
                  <SelectItem value="SERVICE">Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => handleChange("category", e.target.value)}
                placeholder="Enter category"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hsnCode">HSN/SAC Code</Label>
              <Input
                id="hsnCode"
                value={formData.hsnCode}
                onChange={(e) => handleChange("hsnCode", e.target.value)}
                placeholder="Enter HSN/SAC code"
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salesPrice">Sales Price (₹)</Label>
              <Input
                id="salesPrice"
                type="number"
                step="0.01"
                value={formData.salesPrice}
                onChange={(e) => handleChange("salesPrice", e.target.value)}
                placeholder="0.00"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase Price (₹)</Label>
              <Input
                id="purchasePrice"
                type="number"
                step="0.01"
                value={formData.purchasePrice}
                onChange={(e) => handleChange("purchasePrice", e.target.value)}
                placeholder="0.00"
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salesTaxPercent">Sales Tax (%)</Label>
              <Input
                id="salesTaxPercent"
                type="number"
                step="0.01"
                value={formData.salesTaxPercent}
                onChange={(e) => handleChange("salesTaxPercent", e.target.value)}
                placeholder="0.00"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchaseTaxPercent">Purchase Tax (%)</Label>
              <Input
                id="purchaseTaxPercent"
                type="number"
                step="0.01"
                value={formData.purchaseTaxPercent}
                onChange={(e) => handleChange("purchaseTaxPercent", e.target.value)}
                placeholder="0.00"
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {product ? "Update Product" : "Create Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
