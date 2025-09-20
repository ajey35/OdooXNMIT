"use client"

import * as React from "react"

import { cn } from "../../lib/utils"

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    config: Record<string, any>
  }
>(({ className, config, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("w-full", className)}
      style={
        {
          "--color-sales": config.sales?.color,
          "--color-purchases": config.purchases?.color,
          "--color-profit": config.profit?.color,
        } as React.CSSProperties
      }
      {...props}
    />
  )
})
ChartContainer.displayName = "ChartContainer"

const ChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">{label}</span>
            {payload.map((entry: any, index: number) => (
              <span key={index} className="font-bold text-muted-foreground">
                {entry.name}: ₹{entry.value?.toLocaleString()}
              </span>
            ))}
          </div>
        </div>
      </div>
    )
  }
  return null
}

const ChartTooltipContent = ChartTooltip

export { ChartContainer, ChartTooltip, ChartTooltipContent }
