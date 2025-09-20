"use client"
import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { ChevronRight, ChevronDown, Building2 } from "lucide-react"
import { useState } from "react"

interface Account {
  createdAt: string
  id: string
  name: string
  type: "ASSET" | "LIABILITY" | "EXPENSE" | "INCOME" | "EQUITY"
  code: string
  parentId?: string
}

interface AccountTreeProps {
  accounts: Account[]
  onAccountSelect?: (account: Account) => void
}

export function AccountTree({ accounts, onAccountSelect }: AccountTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  const getTypeColor = (type: string) => {
    switch (type) {
      case "ASSET":
        return "bg-green-100 text-green-800 border-green-200"
      case "LIABILITY":
        return "bg-red-100 text-red-800 border-red-200"
      case "INCOME":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "EXPENSE":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "EQUITY":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getTypeIcon = (type: string) => {
    return <Building2 className="h-4 w-4" />
  }

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }

  const buildTree = (accounts: Account[]) => {
    const accountMap = new Map<string, Account & { children: Account[] }>()
    const roots: (Account & { children: Account[] })[] = []

    // Create map with children arrays
    accounts.forEach(account => {
      accountMap.set(account.id, { ...account, children: [] })
    })

    // Build tree structure
    accounts.forEach(account => {
      const node = accountMap.get(account.id)!
      if (account.parentId && accountMap.has(account.parentId)) {
        const parent = accountMap.get(account.parentId)!
        parent.children.push(node)
      } else {
        roots.push(node)
      }
    })

    return roots
  }

  const renderNode = (node: Account & { children: Account[] }, level = 0) => {
    const hasChildren = node.children.length > 0
    const isExpanded = expandedNodes.has(node.id)
    const indent = level * 20

    return (
      <div key={node.id}>
        <div
          className={`flex items-center py-2 px-3 rounded-md hover:bg-gray-50 cursor-pointer transition-colors ${
            onAccountSelect ? "hover:bg-blue-50" : ""
          }`}
          style={{ paddingLeft: `${indent + 12}px` }}
          onClick={() => {
            if (hasChildren) {
              toggleNode(node.id)
            }
            if (onAccountSelect) {
              onAccountSelect(node)
            }
          }}
        >
          {hasChildren && (
            <div className="mr-2">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </div>
          )}
          {!hasChildren && <div className="w-6" />}
          
          <div className="flex-1 flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {getTypeIcon(node.type)}
              <span className="font-mono text-sm text-gray-600">{node.code}</span>
            </div>
            <span className="flex-1 text-sm font-medium">{node.name}</span>
            <Badge variant="outline" className={getTypeColor(node.type)}>
              {node.type}
            </Badge>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  const tree = buildTree(accounts)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Building2 className="h-5 w-5" />
          <span>Chart of Accounts</span>
        </CardTitle>
        <CardDescription>
          Hierarchical view of your accounts
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tree.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No accounts found</p>
            <p className="text-sm">Create your first account to get started</p>
          </div>
        ) : (
          <div className="space-y-1">
            {tree.map(node => renderNode(node))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
