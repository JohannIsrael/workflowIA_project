import type { ReactNode } from "react"
import { useState } from "react"
import { Box, Container, Typography, Drawer, List, ListItem, ListItemText, ListItemIcon, IconButton } from "@mui/material"
import { Folder, Settings, ChevronLeft, ChevronRight, Assignment, Psychology } from "@mui/icons-material"
import { useNavigate, useLocation } from "react-router-dom"
import Header from "@src/components/core/Header"
import ImgLogo from '@src/assets/logo.svg'

interface SidebarLayoutProps {
  children: ReactNode
  center?: boolean
  title?: string
}

const drawerWidth = 240
const collapsedWidth = 60

export default function SidebarLayout({ children, center = false, title }: SidebarLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  
  const menuItems = [
    { text: 'ConsolaI IA ', icon: <Psychology />, path: '/' },
    { text: 'Proyectos', icon: <Folder />, path: '/proyectos' },
    { text: 'Historial', icon: <Assignment />, path: '/logs' },
    { text: 'Configuración', icon: <Settings />, path: '/configuracion' },
  ]

  const toggleCollapse = () => {
    setCollapsed(!collapsed)
  }

  const handleNavigation = (path: string) => {
    navigate(path)
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
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <img src={ImgLogo} alt="Logo" style={{ width: '20px', height: 'auto' }} />
              <Typography
                component="h4"
                variant="h4"
                align="center"
                sx={{ fontSize: '20px', fontWeight: 'bold' }}
              ></Typography>
                FlowPilot
            </Box>
          )}
          <IconButton onClick={toggleCollapse} size="small">
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </IconButton>
        </Box>
        
        <List>
          {menuItems.map((item) => (
            <ListItem 
              key={item.text} 
              onClick={() => handleNavigation(item.path)}
              sx={{
                justifyContent: collapsed ? 'center' : 'flex-start',
                px: collapsed ? 1 : 2,
                backgroundColor: location.pathname === item.path ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.05)',
                },
              }}
            >
              <ListItemIcon sx={{ 
                minWidth: collapsed ? 'auto' : 40,
                justifyContent: 'center',
                color: location.pathname === item.path ? '#1976d2' : 'inherit'
              }}>
                {item.icon}
              </ListItemIcon>
              {!collapsed && (
                <ListItemText 
                  primary={item.text} 
                  sx={{ 
                    color: location.pathname === item.path ? '#1976d2' : 'inherit',
                    fontWeight: location.pathname === item.path ? 'bold' : 'normal'
                  }}
                />
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
          <Header title={title} />
          
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
