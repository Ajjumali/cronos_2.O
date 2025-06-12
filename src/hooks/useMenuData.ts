import { useState, useEffect } from 'react'
import type { VerticalMenuDataType } from '@/types/menuTypes'

interface ApiMenuItem {
  id: string
  title: string
  icon: string | null
  order: string
  type: 'collapse' | 'item' | 'section'
  url: string
  children: ApiMenuItem[]
}
const mapMenuItem = (apiItem: ApiMenuItem): VerticalMenuDataType => {
  // Base properties for all menu types
  const baseProps = {
    id: apiItem.id,
    label: apiItem.title,
    ...(apiItem.icon && { icon: `tabler-${apiItem.icon}` })
  }

  // Handle different menu types
  if (apiItem.type === 'section') {
    return {
      ...baseProps,
      isSection: true,
      children: apiItem.children.map(mapMenuItem)
    }
  }

  if (apiItem.type === 'collapse') {
    return {
      ...baseProps,
      children: apiItem.children.map(mapMenuItem)
    }
  }

  // Default case: menu item
  return {
    ...baseProps,
    href: apiItem.url,
    exactMatch: false,
    activeUrl: apiItem.url
  }
}

export const useMenuData = () => {
  const [menuData, setMenuData] = useState<VerticalMenuDataType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        const response = await fetch('/api/apps/lims/menu-data')

        if (!response.ok) {
          throw new Error(`Failed to fetch menu data: ${response.statusText}`)
        }

        const apiData = await response.json()

        if (!apiData.result || !Array.isArray(apiData.result)) {
          throw new Error('Invalid menu data format received from API')
        }

        const transformedData = apiData.result.map(mapMenuItem)
        setMenuData(transformedData)
      } catch (err) {
        console.error('Error fetching menu data:', err)
        setError(err instanceof Error ? err.message : 'An error occurred while loading menu data')
      } finally {
        setLoading(false)
      }
    }

    fetchMenuData()
  }, [])

  return { menuData, loading, error }
}
