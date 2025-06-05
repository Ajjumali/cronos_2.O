import { authOptions } from '@/libs/auth'
import { getServerSession } from 'next-auth'
import { Category, InstrumentType } from '@/types/apps/limsTypes'
import { getSession } from 'next-auth/react'
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

export const instrumentService = {
  async getCategories(): Promise<Category[]> {
    try {
      const session = await getSession()
      if (!session?.user) {
        throw new Error('No active session found')
      }
      const token = (session.user as any).accessToken
      if (!token) {
        throw new Error('No access token found')
      }
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/testcategory`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }
      const data = await response.json() as APIResponse<LabTestCategoryDto[]>
      if (data && data.result && Array.isArray(data.result)) {
        return data.result.map((category: LabTestCategoryDto) => ({
          id: category.id,
          categoryName: category.name || category.categoryName || '',
          categoryOrder: category.categoryOrder || '',
          activeFlag: category.activeFlag || 'Active',
          timeZoneId: category.timeZoneId || 0,
          parentId: category.parentId || 0,
          modifyBy: category.modifyBy || '',
          modifyOn: category.modifyOn || ''
        }))
      }
      throw new Error('Invalid categories data format')
    } catch (error) {
      console.error('Error fetching categories:', error)
      throw error
    }
  },

  async addInstrument(instrument: InstrumentType): Promise<{ success: boolean; message: string }> {
    try {
      const session = await getSession()
      if (!session?.user) {
        throw new Error('No active session found')
      }
      const token = (session.user as any).accessToken
      if (!token) {
        throw new Error('No access token found')
      }
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/instrument`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(instrument)
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data?.Message || 'Failed to add instrument')
      }

      return {
        success: true,
        message: data?.Message || 'Instrument created successfully'
      }
    } catch (error: any) {
      console.error('Error adding instrument:', error)
      return {
        success: false,
        message: error.message || 'Failed to add instrument'
      }
    }
  },

  async getInstruments(): Promise<InstrumentType[]> {
    try {
      const session = await getSession()
      if (!session?.user) {
        throw new Error('No active session found. Please log in to access this resource.')
      }
      
      const token = (session.user as any).accessToken
      if (!token) {
        throw new Error('No access token found. Please log in again.')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/instrument/all`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || 'Failed to fetch instruments')
      }

      const data = await response.json()
      if (!data || !data.result) {
        throw new Error('Invalid response format from server')
      }

      return data.result
    } catch (error) {
      console.error('Error in getInstruments:', error)
      throw error
    }
  },

  async updateInstrument(id: number, instrument: InstrumentType): Promise<void> {
    try {
      const session = await getSession()
      if (!session?.user) {
        throw new Error('No active session found')
      }
      const token = (session.user as any).accessToken
      if (!token) {
        throw new Error('No access token found')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/instrument/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(instrument)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || 'Failed to update instrument')
      }
    } catch (error) {
      console.error('Error updating instrument:', error)
      throw error
    }
  },

  async deleteInstrument(id: number, reason: string): Promise<void> {
    try {
      const session = await getSession()
      if (!session?.user) {
        throw new Error('No active session found')
      }
      const token = (session.user as any).accessToken
      if (!token) {
        throw new Error('No access token found')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/instrument/${id}?reason=${encodeURIComponent(reason)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      // if (response.status === 404) {
      //   // Redirect to login with signout
      //   //return NextResponse.redirect(new URL('/auth/login?signout=true', request.url))
      // }
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || 'Failed to delete instrument')
      }
    } catch (error) {
      console.error('Error deleting instrument:', error)
      throw error
    }
  },

  async downloadFile(fileType: 'CSV' | 'PDF'): Promise<Blob> {
    try {
      const session = await getSession()
      if (!session?.user) {
        throw new Error('No active session found')
      }
      const token = (session.user as any).accessToken
      if (!token) {
        throw new Error('No access token found')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/instrument/download?fileType=${fileType}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to download file')
      }

      const contentType = fileType === 'CSV' ? 'text/csv' : 'application/pdf'
      const timestamp = new Date().toISOString().replace(/[:.]/g, '_')
      const fileName = `Instrument_${timestamp}.${fileType.toLowerCase()}`

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      return blob
    } catch (error) {
      console.error('Error downloading file:', error)
      throw error
    }
  }
}

export const getInstrumentData = async () => {
  try {
    const response = await instrumentService.getInstruments()
    return response
  } catch (error: any) {
    throw error
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No active session found. Please log in to access this resource.' },
        { status: 401 }
      )
    }

    const instruments = await instrumentService.getInstruments()
    return NextResponse.json({ result: instruments })
  } catch (error: any) {
    console.error('Error in GET /api/apps/lims/Instrument-master:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch instruments' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No active session found. Please log in to access this resource.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const result = await instrumentService.addInstrument(body)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error in POST /api/apps/lims/Instrument-master:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add instrument' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No active session found. Please log in to access this resource.' },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const id = parseInt(url.pathname.split('/').pop() || '0')
    const body = await request.json()
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/instrument/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(session.user as any).accessToken}`
      },
      body: JSON.stringify(body)
    })

    if (response.status === 404) {
      // Redirect to login with signout
      return NextResponse.redirect(new URL('/auth/login?signout=true', request.url))
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.message || 'Failed to update instrument')
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in PUT /api/apps/lims/Instrument-master:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update instrument' },
      { status: 500 }
    )
  }
}
