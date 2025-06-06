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

// Transform API response to menu format
const mapMenuItem = (apiItem: ApiMenuItem): VerticalMenuDataType => {
  const baseProps = {
    id: apiItem.id,
    label: apiItem.title,
    ...(apiItem.icon && { icon: `tabler-${apiItem.icon}` }),
  };

  if (apiItem.type === 'section') {
    return {
      ...baseProps,
      isSection: true,
      children: apiItem.children?.map(mapMenuItem) || []
    };
  }

  if (apiItem.type === 'collapse') {
    return {
      ...baseProps,
      children: apiItem.children?.map(mapMenuItem) || []
    };
  }

  return {
    ...baseProps,
    href: apiItem.url,
    exactMatch: false,
    activeUrl: apiItem.url
  };
};

// const mapMenuItem = (apiItem: ApiMenuItem): VerticalMenuDataType => {
//   const baseProps = {
//     id: apiItem.id,
//     label: apiItem.title,
//     ...(apiItem.icon && { icon: `tabler-${apiItem.icon}` })
//   }

//   if (apiItem.type === 'section') {
//     return {
//       ...baseProps,
//       isSection: true,
//       children: apiItem.children?.map(mapMenuItem) || []
//     }
//   }

//   if (apiItem.type === 'collapse') {
//     return {
//       ...baseProps,
//       children: apiItem.children?.map(mapMenuItem) || []
//     }
//   }

//   return {
//     ...baseProps,
//     href: apiItem.url,
//     exactMatch: false,
//     activeUrl: apiItem.url
//   }
// }

export const useMenuData = () => {
  const [menuData, setMenuData] = useState<VerticalMenuDataType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        const session = await getSession()

        if (!session) throw new Error('No active session found')

        const token = (session?.user as any)?.accessToken
        const userTypeId = (session?.user as any)?.userTypeId

        if (!token || !userTypeId) {
          throw new Error('Missing token or userTypeId from session')
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL
        if (!apiUrl) {
          throw new Error('Environment variable NEXT_PUBLIC_API_URL is not defined')
        }
       console.log(token, userTypeId)
        console.log('Fetching from API:', `${apiUrl}/v1/personal/permissions?userTypeId=${userTypeId}`)
        const response = await fetch(
          `https://ec7e-182-70-113-122.ngrok-free.app/api/v1/personal/permissions?userTypeId=${userTypeId}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            }
          }
        )
        
        // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/personal/permissions?userTypeId=${userTypeId}`, {
        //   method: 'GET',
        //   headers: {
        //     Authorization: `Bearer ${token}`,
        //     'Content-Type': 'application/json'
        //   }
        // });
        
        const contentType = response.headers.get('content-type') || '';
        
        if (!contentType.includes('application/json')) {
          const raw = await response.text();
          throw new Error(`Non-JSON response:\n${raw.slice(0, 200)}...`);
        }
        
        const apiData = await response.json();
        
        if (!apiData?.result || !Array.isArray(apiData.result)) {
          throw new Error('Invalid structure: `result` array missing');
        }
        
        const transformedData = apiData.result.map(mapMenuItem);
        setMenuData(transformedData);
        
        // const response = await fetch(`${apiUrl}/v1/personal/permissions?userTypeId=${userTypeId}`, {
        //   method: 'GET',
        //   headers: {
        //     Authorization: `Bearer ${token}`,
        //     'Content-Type': 'application/json'
        //   }
        // })

        // if (!response.ok) {
        //   const text = await response.text()
        //   throw new Error(`Failed to fetch menu data (Status: ${response.status}) - ${text}`)
        // }

        // const apiData = await response.json()

        // if (!apiData?.result || !Array.isArray(apiData.result)) {
        //   throw new Error('Invalid menu structure in API response')
        // }

        // const transformedData = apiData.result.map(mapMenuItem)
        // setMenuData(transformedData)
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
