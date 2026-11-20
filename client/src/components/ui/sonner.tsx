import type { CSSProperties } from "react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="light"
      position="bottom-center"
      closeButton
      duration={6000}
      offset={16}
      mobileOffset={{ bottom: 16, left: 12, right: 12 }}
      style={
        {
          "--width": "min(22rem, calc(100vw - 24px))",
        } as CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
