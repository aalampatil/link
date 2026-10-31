import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "field flex h-11 file:border-0 file:bg-transparent file:text-sm disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    />
  )
}

export { Input }
