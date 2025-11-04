"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: 'group toast group-[.toaster]:bg-white group-[.toaster]:text-gray-900 group-[.toaster]:border-gray-200 group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-gray-600',
          actionButton: 'group-[.toast]:bg-gray-900 group-[.toast]:text-white',
          cancelButton: 'group-[.toast]:bg-gray-100 group-[.toast]:text-gray-600',
          success: '!bg-green-600 !text-white !border-green-700',
          error: '!bg-red-600 !text-white !border-red-700',
          warning: '!bg-yellow-600 !text-white !border-yellow-700',
          info: '!bg-blue-600 !text-white !border-blue-700',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
