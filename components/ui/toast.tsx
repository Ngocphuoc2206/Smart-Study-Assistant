"use client"

import * as React from "react"
import * as ToastPrimitive from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const toastVariants = cva(
  "group pointer-events-auto relative grid grid-cols-[auto_1fr] items-center gap-3 rounded-md border bg-popover p-3 shadow-lg",
  {
    variants: {
      variant: {
        default: "",
        destructive: "border-destructive/40 bg-destructive/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Toast({ className, variant, ...props }: React.ComponentProps<typeof ToastPrimitive.Root> & VariantProps<typeof toastVariants>) {
  return (
    <ToastPrimitive.Root
      className={cn(toastVariants({ variant, className }))}
      {...props}
    />
  )
}

function ToastProvider({ children, ...props }: React.ComponentProps<typeof ToastPrimitive.Provider>) {
  return (
    <ToastPrimitive.Provider swipeDirection="right" {...props}>
      {children}
    </ToastPrimitive.Provider>
  )
}

function ToastViewport(props: React.ComponentProps<typeof ToastPrimitive.Viewport>) {
  return (
    <ToastPrimitive.Viewport
      {...props}
      className={cn(
        "fixed bottom-6 right-6 z-9999 flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-3 p-0 outline-none",
        props.className
      )}
    />
  )
}

function ToastTitle({ className, ...props }: React.ComponentProps<typeof ToastPrimitive.Title>) {
  return (
    <ToastPrimitive.Title
      className={cn("font-medium text-sm", className)}
      {...props}
    />
  )
}

function ToastDescription({ className, ...props }: React.ComponentProps<typeof ToastPrimitive.Description>) {
  return (
    <ToastPrimitive.Description
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function ToastAction({ className, ...props }: React.ComponentProps<typeof ToastPrimitive.Action>) {
  return (
    <ToastPrimitive.Action
      className={cn(
        "inline-flex items-center rounded-md bg-transparent px-2 py-1 text-sm font-medium text-primary hover:underline",
        className
      )}
      {...props}
    />
  )
}

export {
  Toast,
  ToastProvider,
  ToastViewport,
  ToastTitle,
  ToastDescription,
  ToastAction,
}
