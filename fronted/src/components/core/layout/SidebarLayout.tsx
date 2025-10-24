import type { ReactNode } from "react"
import { useState } from "react"
import { Box, Container, Typography, Drawer, List, ListItem, ListItemText, ListItemIcon, IconButton } from "@mui/material"
import { Dashboard, Folder, Settings, ChevronLeft, ChevronRight } from "@mui/icons-material"
import Header from "@src/components/core/Header"

interface SidebarLayoutProps {
  children: ReactNode
  center?: boolean
}

const drawerWidth = 240
const collapsedWidth = 60

export default function SidebarLayout({ children, center = false }: SidebarLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  
  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard /> },
    { text: 'Proyectos', icon: <Folder /> },
    { text: 'Configuración', icon: <Settings /> },
  ]

  const toggleCollapse = () => {
    setCollapsed(!collapsed)
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Contenedor principal con sidebar y contenido */}
      <Box sx={{ display: "flex", flex: 1 }}>
        {/* Sidebar */}
        <Drawer
        variant="permanent"
        sx={{
          width: collapsed ? collapsedWidth : drawerWidth,
          flexShrink: 0,
          transition: 'width 0.3s ease',
          '& .MuiDrawer-paper': {
            width: collapsed ? collapsedWidth : drawerWidth,
            boxSizing: 'border-box',
            transition: 'width 0.3s ease',
            overflowX: 'hidden',
            position: 'relative',
            height: '100%',
          },
        }}
      >
        <Box sx={{ 
          p: 2, 
          textAlign: 'center', 
          borderBottom: 1, 
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between'
        }}>
          {!collapsed && (
            <Typography variant="h6" component="div">
              FlowPilot
            </Typography>
          )}
          <IconButton onClick={toggleCollapse} size="small">
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </IconButton>
        </Box>
        
        <List>
          {menuItems.map((item) => (
            <ListItem 
              key={item.text} 
              button
              sx={{
                justifyContent: collapsed ? 'center' : 'flex-start',
                px: collapsed ? 1 : 2,
              }}
            >
              <ListItemIcon sx={{ 
                minWidth: collapsed ? 'auto' : 40,
                justifyContent: 'center'
              }}>
                {item.icon}
              </ListItemIcon>
              {!collapsed && (
                <ListItemText primary={item.text} />
              )}
            </ListItem>
          ))}
        </List>
      </Drawer>

        {/* Contenido principal */}
        <Box sx={{ 
          display: "flex", 
          flexDirection: "column", 
          flex: 1,
        }}>
          {/* Navbar dentro del contenido */}
          <Header />
          
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
      </Box>
    </Box>
  )
}
