import type { ReactNode } from "react"
import { useLocation } from "react-router-dom"
import Layout from "@src/components/core/layout/Layout"
import SidebarLayout from "@src/components/core/layout/SidebarLayout"

interface ConditionalLayoutProps {
  children: ReactNode
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const location = useLocation()
  
  // Páginas que NO deben tener sidebar
  const noSidebarPages = ['/login']
  
  const shouldShowSidebar = !noSidebarPages.includes(location.pathname)
  
  if (shouldShowSidebar) {
    return <SidebarLayout>{children}</SidebarLayout>
  }
  
  return <Layout>{children}</Layout>
}
