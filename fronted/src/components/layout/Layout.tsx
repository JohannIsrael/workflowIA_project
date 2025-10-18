import type { ReactNode } from "react"
import { Box, Container } from "@mui/material"
import Header from "@components/Header"

interface LayoutProps {
  children: ReactNode
  center?: boolean
}

export default function Layout({ children, center = false }: LayoutProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header/>
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
