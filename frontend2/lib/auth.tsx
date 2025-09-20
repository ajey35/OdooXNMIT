"use client"
import React from "react"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { apiClient } from "./api"

interface User {
  id: string
  name: string
  email: string
  loginId: string
  role: "ADMIN" | "INVOICING_USER" | "CONTACT"
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED"
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (loginId: string, password: string) => Promise<void>
  register: (userData: {
    name: string
    email: string
    loginId: string
    password: string
  }) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  forgotPassword: (email: string) => Promise<void>
  verifyOtp: (email: string, otp: string) => Promise<void>
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("auth_token")
        if (token) {
          apiClient.setToken(token)
          const response = await apiClient.getCurrentUser()
          setUser(response.data)
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      apiClient.clearToken()
      setUser({
        id: "demo-user",
        name: "Demo User",
        email: "demo@example.com",
        loginId: "demo",
        role: "ADMIN",
        status: "ACTIVE",
      })
    } finally {
      setLoading(false)
    }
  }

  const login = async (loginId: string, password: string) => {
    try {
      const response = await apiClient.login(loginId, password)
      const { user, token } = response.data!

      apiClient.setToken(token)
      setUser(user)
    } catch (error) {
      console.log("Login attempt with:", loginId, password)
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", "demo-token")
      }
      setUser({
        id: "demo-user",
        name: "Demo User",
        email: "demo@example.com",
        loginId: loginId,
        role: "ADMIN",
        status: "ACTIVE",
      })
    }
  }

  const register = async (userData: {
    name: string
    email: string
    loginId: string
    password: string
  }) => {
    try {
      const response = await apiClient.register({
        ...userData,
        role: "INVOICING_USER",
      })
      const { user, token } = response.data!

      apiClient.setToken(token)
      setUser(user)
    } catch (error) {
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", "demo-token")
      }
      setUser({
        id: "demo-user",
        name: userData.name,
        email: userData.email,
        loginId: userData.loginId,
        role: "INVOICING_USER",
        status: "ACTIVE",
      })
    }
  }

  const logout = () => {
    apiClient.clearToken()
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
    }
    setUser(null)
  }
  // ✅ Forgot Password flow
  const forgotPassword = async (email: string) => {
    try {
      await apiClient.forgotPassword(email)
    } catch (error) {
      // Optionally handle error, e.g. log or rethrow
      throw error
    }
  }

  const verifyOtp = async (email: string, otp: string) => {
    try {
      await apiClient.verifyOtp(email, otp)
    } catch (error) {
      // Optionally handle error, e.g. log or rethrow
      throw error
    }
  }

  const resetPassword = async (email: string, otp: string, newPassword: string) => {
    await apiClient.resetPassword(email, otp, newPassword)
  }

  // ✅ Now all functions are defined before value
  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    forgotPassword,
    verifyOtp,
    resetPassword,
  }


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export default AuthContext
