import type { ReactNode } from "react"
import { Box, Container } from "@mui/material"
import Header from "@src/components/core/Header"

interface LayoutProps {
  children: ReactNode
  center?: boolean
  title?: string
}

export default function Layout({ children, center = false, title }: LayoutProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header title={title}/>
      <Container 
        maxWidth="lg" 
        sx={{ 
          flex: 1, 
          mt: 2, 
          mb: 2,
          px: { xs: 2, sm: 3 },
          ...(center && { display: 'flex', alignItems: 'center', justifyContent: 'center' })
        }}
      >
        {children}
      </Container>
    </Box>
  )
}
