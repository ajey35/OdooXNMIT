const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"

interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

class ApiClient {
  get(arg0: string, arg1: { params: { asOfDate: string } }) {
    throw new Error("Method not implemented.")
  }
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token")
    }
  }

  setToken(token: string) {
    this.token = token
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token)
    }
  }

  clearToken() {
    this.token = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "API request failed")
      }

      return data
    } catch (error) {
      console.error("API request error:", error)
      throw error
    }
  }

  // Auth endpoints
  async login(loginId: string, password: string) {
    return this.request<{
      user: any
      token: string
      refreshToken: string
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ loginId, password }),
    })
  }

  async register(userData: {
    name: string
    email: string
    loginId: string
    password: string
    role?: string
  }) {
    return this.request<{
      user: any
      token: string
      refreshToken: string
    }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  }

  async getCurrentUser() {
    return this.request<any>("/auth/me")
  }

  async forgotPassword(email: string) {
    return this.request<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    })
  }

  async verifyOtp(email: string, otp: string) {
    return this.request<{ message: string }>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    })
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    return this.request<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, otp, newPassword }),
    })
  }

  // Contacts endpoints
  async getContacts(params?: {
    page?: number
    limit?: number
    type?: string
    search?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    return this.request<any[]>(`/contacts?${searchParams}`)
  }

  async createContact(contactData: any) {
    return this.request<any>("/contacts", {
      method: "POST",
      body: JSON.stringify(contactData),
    })
  }

  async updateContact(id: string, contactData: any) {
    return this.request<any>(`/contacts/${id}`, {
      method: "PUT",
      body: JSON.stringify(contactData),
    })
  }

  async deleteContact(id: string) {
    return this.request<any>(`/contacts/${id}`, {
      method: "DELETE",
    })
  }

  // Products endpoints
  async getProducts(params?: {
    page?: number
    limit?: number
    type?: string
    search?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    return this.request<any[]>(`/products?${searchParams}`)
  }

  async createProduct(productData: any) {
    return this.request<any>("/products", {
      method: "POST",
      body: JSON.stringify(productData),
    })
  }

  async updateProduct(id: string, productData: any) {
    return this.request<any>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(productData),
    })
  }

  async deleteProduct(id: string) {
    return this.request<any>(`/products/${id}`, {
      method: "DELETE",
    })
  }

  // Taxes endpoints
  async getTaxes(params?: {
    page?: number
    limit?: number
    search?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    return this.request<any[]>(`/taxes?${searchParams}`)
  }

  async createTax(taxData: any) {
    return this.request<any>("/taxes", {
      method: "POST",
      body: JSON.stringify(taxData),
    })
  }

  async updateTax(id: string, taxData: any) {
    return this.request<any>(`/taxes/${id}`, {
      method: "PUT",
      body: JSON.stringify(taxData),
    })
  }

  async deleteTax(id: string) {
    return this.request<any>(`/taxes/${id}`, {
      method: "DELETE",
    })
  }

  // Chart of Accounts endpoints
  async getChartOfAccounts(params?: {
    page?: number
    limit?: number
    search?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    return this.request<any[]>(`/chart-of-accounts?${searchParams}`)
  }

  async createAccount(accountData: any) {
    return this.request<any>("/chart-of-accounts", {
      method: "POST",
      body: JSON.stringify(accountData),
    })
  }

  async updateAccount(id: string, accountData: any) {
    return this.request<any>(`/chart-of-accounts/${id}`, {
      method: "PUT",
      body: JSON.stringify(accountData),
    })
  }

  async deleteAccount(id: string) {
    return this.request<any>(`/chart-of-accounts/${id}`, {
      method: "DELETE",
    })
  }
  // Chart of Accounts endpoints

  // Dashboard endpoints
  async getDashboardStats() {
    return this.request<any>("/reports/dashboard")
  }

  // Reports endpoints
  async getBalanceSheet(asOfDate?: string) {
    const params = asOfDate ? `?asOfDate=${asOfDate}` : ""
    return this.request<any>(`/reports/balance-sheet${params}`)
  }

  async getProfitLoss(startDate: string, endDate: string) {
    return this.request<any>(`/reports/profit-loss?startDate=${startDate}&endDate=${endDate}`)
  }

  // Purchase Orders endpoints
  async getPurchaseOrders(params?: {
    page?: number
    limit?: number
    status?: string
    search?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    return this.request<any[]>(`/purchase-orders?${searchParams}`)
  }

  async createPurchaseOrder(orderData: any) {
    return this.request<any>("/purchase-orders", {
      method: "POST",
      body: JSON.stringify(orderData),
    })
  }

  async updatePurchaseOrder(id: string, orderData: any) {
    return this.request<any>(`/purchase-orders/${id}`, {
      method: "PUT",
      body: JSON.stringify(orderData),
    })
  }

  async deletePurchaseOrder(id: string) {
    return this.request<any>(`/purchase-orders/${id}`, {
      method: "DELETE",
    })
  }

  // Sales Orders endpoints
  async getSalesOrders(params?: {
    page?: number
    limit?: number
    status?: string
    search?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    return this.request<any[]>(`/sales-orders?${searchParams}`)
  }

  async createSalesOrder(orderData: any) {
    return this.request<any>("/sales-orders", {
      method: "POST",
      body: JSON.stringify(orderData),
    })
  }

  async updateSalesOrder(id: string, orderData: any) {
    return this.request<any>(`/sales-orders/${id}`, {
      method: "PUT",
      body: JSON.stringify(orderData),
    })
  }

  async deleteSalesOrder(id: string) {
    return this.request<any>(`/sales-orders/${id}`, {
      method: "DELETE",
    })
  }

  // Vendor Bills endpoints
  async getVendorBills(params?: {
    page?: number
    limit?: number
    status?: string
    search?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    return this.request<any[]>(`/vendor-bills?${searchParams}`)
  }

  async createVendorBill(billData: any) {
    return this.request<any>("/vendor-bills", {
      method: "POST",
      body: JSON.stringify(billData),
    })
  }

  async updateVendorBill(id: string, billData: any) {
    return this.request<any>(`/vendor-bills/${id}`, {
      method: "PUT",
      body: JSON.stringify(billData),
    })
  }

  async deleteVendorBill(id: string) {
    return this.request<any>(`/vendor-bills/${id}`, {
      method: "DELETE",
    })
  }

  // Customer Invoices endpoints
  async getCustomerInvoices(params?: {
    page?: number
    limit?: number
    status?: string
    search?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    return this.request<any[]>(`/customer-invoices?${searchParams}`)
  }

  async createCustomerInvoice(invoiceData: any) {
    return this.request<any>("/customer-invoices", {
      method: "POST",
      body: JSON.stringify(invoiceData),
    })
  }

  async updateCustomerInvoice(id: string, invoiceData: any) {
    return this.request<any>(`/customer-invoices/${id}`, {
      method: "PUT",
      body: JSON.stringify(invoiceData),
    })
  }

  async deleteCustomerInvoice(id: string) {
    return this.request<any>(`/customer-invoices/${id}`, {
      method: "DELETE",
    })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
export type { ApiResponse }
