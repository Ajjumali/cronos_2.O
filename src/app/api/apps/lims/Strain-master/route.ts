import { authOptions } from '@/libs/auth'
import { getServerSession } from 'next-auth'
import { StrainType } from '@/types/apps/limsTypes'
import { getSession } from 'next-auth/react'
import { NextResponse } from 'next/server'

interface APIResponse<T> {
  result: T
  Status: string
}

export const strainService = {
  async getStrains(): Promise<StrainType[]> {
    try {
      const session = await getSession()
      if (!session?.user) {
        throw new Error('No active session found. Please log in to access this resource.')
      }
      
      const token = (session.user as any).accessToken
      if (!token) {
        throw new Error('No access token found. Please log in again.')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/strain/all`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || 'Failed to fetch strains')
      }

      const data = await response.json()
      if (!data || !data.result) {
        throw new Error('Invalid response format from server')
      }

      return data.result
    } catch (error) {
      console.error('Error in getStrains:', error)
      throw error
    }
  },

  async addStrain(strain: StrainType): Promise<{ success: boolean; message: string }> {
    try {
      const session = await getSession()
      if (!session?.user) {
        throw new Error('No active session found')
      }
      const token = (session.user as any).accessToken
      if (!token) {
        throw new Error('No access token found')
      }
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/strain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(strain)
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data?.Message || 'Failed to add strain')
      }

      return {
        success: true,
        message: data?.Message || 'Strain created successfully'
      }
    } catch (error: any) {
      console.error('Error adding strain:', error)
      return {
        success: false,
        message: error.message || 'Failed to add strain'
      }
    }
  },

  async updateStrain(id: number, strain: StrainType): Promise<void> {
    try {
      const session = await getSession()
      if (!session?.user) {
        throw new Error('No active session found')
      }
      const token = (session.user as any).accessToken
      if (!token) {
        throw new Error('No access token found')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/strain/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(strain)
      })

      if (!response.ok) {
        throw new Error('Failed to update strain')
      }
    } catch (error) {
      console.error('Error updating strain:', error)
      throw error
    }
  },

  async deleteStrain(id: number, reason: string): Promise<void> {
    try {
      const session = await getSession()
      if (!session?.user) {
        throw new Error('No active session found')
      }
      const token = (session.user as any).accessToken
      if (!token) {
        throw new Error('No access token found')
      }
      
      // Ensure reason is properly encoded
      const encodedReason = encodeURIComponent(reason.trim())
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/strain/${id}?reason=${encodedReason}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || 'Failed to delete strain')
      }
    } catch (error) {
      console.error('Error deleting strain:', error)
      throw error
    }
  },

  async downloadFile(fileType: 'PDF' | 'CSV'): Promise<void> {
    try {
      const session = await getSession()
      if (!session?.user) {
        throw new Error('No active session found')
      }
      const token = (session.user as any).accessToken
      if (!token) {
        throw new Error('No access token found')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/strain/download?fileType=${fileType}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to download ${fileType} file`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Strain_List.${fileType.toLowerCase()}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error(`Error downloading ${fileType} file:`, error)
      throw error
    }
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

    const strains = await strainService.getStrains()
    return NextResponse.json({ result: strains })
  } catch (error: any) {
    console.error('Error in GET /api/apps/lims/Strain-master:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch strains' },
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
    const result = await strainService.addStrain(body)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error in POST /api/apps/lims/Strain-master:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add strain' },
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
    
    await strainService.updateStrain(id, body)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in PUT /api/apps/lims/Strain-master:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update strain' },
      { status: 500 }
    )
  }
}
