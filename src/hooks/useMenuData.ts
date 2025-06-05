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
        if (!session?.user) {
          throw new Error('No active session found')
        }

        const token = (session.user as any).accessToken
        const userTypeId = (session.user as any)?.userTypeId

        if (!token || !userTypeId) {
          throw new Error('Missing authentication data')
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/personal/permissions?userTypeId=${userTypeId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              Accept: 'application/json'
            }
          }
        )

        // Check if the response is JSON
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text()
          console.error('Non-JSON response:', text)
          throw new Error('Server returned non-JSON response')
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => null)
          throw new Error(
            `Failed to fetch menu data: ${response.status} ${response.statusText}${
              errorData ? ` - ${JSON.stringify(errorData)}` : ''
            }`
          )
        }

        const apiData = await response.json()
        
        if (!apiData.result || !Array.isArray(apiData.result)) {
          throw new Error('Invalid API response format')
        }

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
