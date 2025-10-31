import type { ReactNode } from "react"
import { useLocation } from "react-router-dom"
import Layout from "@src/components/core/layout/Layout"
import SidebarLayout from "@src/components/core/layout/SidebarLayout"
import SimpleLayout from "@src/components/core/layout/SimpleLayout"

interface ConditionalLayoutProps {
  children: ReactNode
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const location = useLocation()
  
  // Páginas que NO deben tener sidebar ni navbar
  const noLayoutPages = ['/login']
  
  // Páginas que solo tienen navbar (sin sidebar)
  const navbarOnlyPages = ['/register', '/forgot-password'] // ejemplos para futuro
  
  // Determinar el título basado en la ruta
  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/dashboard':
        return 'ConsolaI IA'
      case '/proyectos':
        return 'Proyectos'
      case '/logs':
        return 'System Logs'
      case '/profile':
        return 'Mi perfil'
      case '/configuracion':
        return 'Configuración'
      case '/':
        return 'Detalle del Proyecto'
      default:
        return undefined
    }
  }
  
  const pageTitle = getPageTitle(location.pathname)
  
  if (noLayoutPages.includes(location.pathname)) {
    return <SimpleLayout>{children}</SimpleLayout>
  }
  
  if (navbarOnlyPages.includes(location.pathname)) {
    return <Layout title={pageTitle}>{children}</Layout>
  }
  
  // Páginas con sidebar y navbar
  return <SidebarLayout title={pageTitle}>{children}</SidebarLayout>
}
