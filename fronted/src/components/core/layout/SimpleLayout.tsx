import type { ReactNode } from "react"
import { Box } from "@mui/material"

interface SimpleLayoutProps {
  children: ReactNode
}

export default function SimpleLayout({ children }: SimpleLayoutProps) {
  return (
    <Box sx={{ minHeight: "100vh" }}>
      {children}
    </Box>
  )
}
