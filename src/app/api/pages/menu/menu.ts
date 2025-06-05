import type { NextApiRequest, NextApiResponse } from 'next'
import type { VerticalMenuDataType } from '@/types/menuTypes'

// This is just an example structure - modify according to your database schema
interface MenuItemDB {
  id: string
  label: string
  icon?: string
  href?: string
  parent_id?: string | null
  is_section?: boolean
  order: number
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<VerticalMenuDataType[]>) {
  if (req.method !== 'GET') {
    return res.status(405).end()
  }

  try {
    // Replace this with your actual database query
    // Example using prisma:
    // const menuItems = await prisma.menuItems.findMany({
    //   orderBy: { order: 'asc' }
    // })

    // Transform the flat database structure into a nested menu structure
    const transformToMenuStructure = (items: MenuItemDB[]): VerticalMenuDataType[] => {
      const itemMap = new Map()
      const rootItems: VerticalMenuDataType[] = []

      // First pass: Create all items
      items.forEach(item => {
        const menuItem = {
          label: item.label,
          ...(item.icon && { icon: item.icon }),
          ...(item.href && { href: item.href }),
          ...(item.is_section && { isSection: true }),
          children: []
        }
        itemMap.set(item.id, menuItem)
      })

      // Second pass: Build the tree structure
      items.forEach(item => {
        const menuItem = itemMap.get(item.id)
        if (item.parent_id) {
          const parent = itemMap.get(item.parent_id)
          if (parent) {
            if (!parent.children) parent.children = []
            parent.children.push(menuItem)
          }
        } else {
          rootItems.push(menuItem)
        }
      })

      return rootItems
    }

    // Mock data for example - replace with actual database call
    const mockMenuItems: MenuItemDB[] = [
      {
        id: '1',
        label: 'Dashboards',
        icon: 'tabler-smart-home',
        order: 1,
        parent_id: null
      }
      // Add more mock items as needed
    ]

    const menuStructure = transformToMenuStructure(mockMenuItems)
    res.status(200).json(menuStructure)
  } catch (error) {
    console.error('Error fetching menu data:', error)
    res.status(500).json([])
  }
}
