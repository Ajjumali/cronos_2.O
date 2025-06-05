import { useState, useEffect } from 'react'
import type { VerticalMenuDataType } from '@/types/menuTypes'
import { getSession } from 'next-auth/react'

// Define the API menu item type
interface ApiMenuItem {
  id: string
  title: string
  icon: string | null
  order: string
  type: 'collapse' | 'item' | 'section'
  url: string
  children: ApiMenuItem[]
}

// Mapping function to transform API response to UI format
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
        const session = await getSession()
        const token = (session?.user as any).accessToken
        const userTypeId = (session?.user as any)?.userTypeId
        console.log('API URL:', process.env.API_URL)
        const response = await fetch(
          `${process.env.API_URL}/v1/personal/permissions?userTypeId=${userTypeId}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        )
        console.log('API URL:', response)
        // if (!response.ok) {
        //   throw new Error(`Failed to fetch menu data: ${response.statusText}`)
        // }

        const apiData = await response.json()
        const transformedData = apiData.result.map(mapMenuItem)
        setMenuData(transformedData)
      } catch (err) {
        console.error('Error fetching menu data:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchMenuData()
  }, [])

  return { menuData, loading, error }
}
