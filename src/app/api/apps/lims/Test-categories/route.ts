import { authOptions } from '@/libs/auth'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

interface APIResponse<T> {
  result: T
  Status: string
}

interface LabTestCategoryDto {
  id: number
  name?: string
  categoryName?: string
  categoryOrder?: string
  activeFlag?: string
  timeZoneId?: number
  parentId?: number
  modifyBy?: string
  modifyOn?: string
}

// GET /api/apps/lims/Test-categories
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No active session found. Please log in to access this resource.' },
        { status: 401 }
      )
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/testcategory`, {
      headers: {
        Authorization: `Bearer ${(session.user as any).accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('External API Error:', errorText)
      return NextResponse.json(
        { error: `Failed to fetch categories: ${response.status} ${response.statusText}` },
        { status: response.status }
      )
    }

    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Invalid response format from external API' }, { status: 500 })
    }

    const data = (await response.json()) as APIResponse<LabTestCategoryDto[]>
    if (data && data.result && Array.isArray(data.result)) {
      const categories = data.result.map((category: LabTestCategoryDto) => ({
        id: category.id,
        categoryName: category.name || category.categoryName || '',
        categoryOrder: category.categoryOrder || '',
        activeFlag: category.activeFlag || 'Active',
        timeZoneId: category.timeZoneId || 0,
        parentId: category.parentId || 0,
        modifyBy: category.modifyBy || '',
        modifyOn: category.modifyOn || ''
      }))
      return NextResponse.json({ result: categories })
    }
    return NextResponse.json({ error: 'Invalid categories data format' }, { status: 500 })
  } catch (error: any) {
    console.error('Error in GET /api/apps/lims/Test-categories:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch categories' }, { status: 500 })
  }
}
