"use client"

import React, { useState, useEffect, useRef } from "react"
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

interface HSNItem {
  c: string
  n: string
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
  const [hsnSuggestions, setHsnSuggestions] = useState<HSNItem[]>([])
  const [searchingHSN, setSearchingHSN] = useState(false)
  const [showHsnSuggestions, setShowHsnSuggestions] = useState(false)
  const [selectedHsnIndex, setSelectedHsnIndex] = useState(-1)
  const hsnContainerRef = useRef<HTMLDivElement>(null)

  // Fetch HSN suggestions from GST API
  const fetchHSNSuggestions = async (query: string) => {
    if (!query) return
    setSearchingHSN(true)
    try {
      const category = formData.type === "GOODS" ? "P" : "S"
      const url = `https://services.gst.gov.in/commonservices/hsn/search/qsearch?inputText=${encodeURIComponent(
        query
      )}&selectedType=byDesc&category=${category}`

      const response = await fetch(url)
      if (!response.ok) throw new Error("Failed to fetch HSN codes")

      const data = await response.json()
      setHsnSuggestions(data.data || [])
      setShowHsnSuggestions(true)
      setSelectedHsnIndex(-1)
    } catch (err) {
      console.error(err)
      setHsnSuggestions([])
      setShowHsnSuggestions(false)
    } finally {
      setSearchingHSN(false)
    }
  }

  // Debounce input for HSN search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.hsnCode.length >= 2) {
        fetchHSNSuggestions(formData.hsnCode)
      } else {
        setHsnSuggestions([])
        setShowHsnSuggestions(false)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [formData.hsnCode, formData.type])

  // Handle HSN selection
  const handleHsnSelect = (hsnCode: string) => {
    setFormData((prev) => ({ ...prev, hsnCode }))
    setShowHsnSuggestions(false)
    setHsnSuggestions([])
    setSelectedHsnIndex(-1)
  }

  // Handle keyboard navigation
  const handleHsnKeyDown = (e: React.KeyboardEvent) => {
    if (!showHsnSuggestions || hsnSuggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedHsnIndex(prev => 
          prev < hsnSuggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedHsnIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedHsnIndex >= 0 && selectedHsnIndex < hsnSuggestions.length) {
          handleHsnSelect(hsnSuggestions[selectedHsnIndex].c)
        }
        break
      case 'Escape':
        setShowHsnSuggestions(false)
        setSelectedHsnIndex(-1)
        break
    }
  }

  // Handle input focus/blur
  const handleHsnFocus = () => {
    if (hsnSuggestions.length > 0) {
      setShowHsnSuggestions(true)
    }
  }

  const handleHsnBlur = () => {
    // Delay hiding to allow click on suggestions
    setTimeout(() => {
      setShowHsnSuggestions(false)
    }, 200)
  }

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (hsnContainerRef.current && !hsnContainerRef.current.contains(event.target as Node)) {
        setShowHsnSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const productData = {
        ...formData,
        salesPrice: Number(formData.salesPrice) || 0,
        purchasePrice: Number(formData.purchasePrice) || 0,
        salesTaxPercent: Number(formData.salesTaxPercent) || 0,
        purchaseTaxPercent: Number(formData.purchaseTaxPercent) || 0,
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
      // Clear HSN suggestions
      setHsnSuggestions([])
      setShowHsnSuggestions(false)
      setSelectedHsnIndex(-1)
    } catch (err: any) {
      setError(err.message || "Failed to save product")
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

          {/* Name & Type */}
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
              <Select
                value={formData.type}
                onValueChange={(value) => handleChange("type", value)}
                disabled={loading}
              >
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

          {/* Category & HSN */}
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

            <div className="space-y-2 relative" ref={hsnContainerRef}>
              <Label htmlFor="hsnCode">HSN / SAC Code</Label>
              <div className="relative">
                <Input
                  id="hsnCode"
                  value={formData.hsnCode}
                  onChange={(e) => handleChange("hsnCode", e.target.value)}
                  onFocus={handleHsnFocus}
                  onBlur={handleHsnBlur}
                  onKeyDown={handleHsnKeyDown}
                  placeholder="Enter HSN code or description"
                  disabled={loading}
                  className="pr-8"
                />
                {searchingHSN && (
                  <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {showHsnSuggestions && hsnSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {hsnSuggestions.map((item, index) => (
                    <div
                      key={item.c}
                      className={`px-3 py-2 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors ${
                        index === selectedHsnIndex 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleHsnSelect(item.c)}
                      onMouseEnter={() => setSelectedHsnIndex(index)}
                    >
                      <div className="font-medium text-sm text-gray-900">{item.c}</div>
                      <div className="text-xs text-gray-600 truncate">{item.n}</div>
                    </div>
                  ))}
                </div>
              )}
              {showHsnSuggestions && hsnSuggestions.length === 0 && !searchingHSN && formData.hsnCode.length >= 2 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3 text-center text-sm text-gray-500">
                  No HSN codes found
                </div>
              )}
            </div>
          </div>

          {/* Prices */}
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

          {/* Taxes */}
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

          {/* Buttons */}
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
