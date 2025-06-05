import { authOptions } from '@/libs/auth'
import { getServerSession } from 'next-auth'
import { AnalyteCodeType, InstrumentType, SampleType, TestType } from '@/types/apps/limsTypes'
import { getSession } from 'next-auth/react'
import { NextResponse } from 'next/server'
import { toast } from 'react-toastify'

interface APIResponse<T> {
  result: T
  Status: string
}

export const analyteCodeService = {
  async getInstruments(): Promise<InstrumentType[]> {
    try {
      const session = await getSession()
      if (!session?.user) {
        throw new Error('No active session found')
      }
      const token = (session.user as any).accessToken
      if (!token) {
        throw new Error('No access token found')
      }
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/instrument/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!response.ok) {
        throw new Error('Failed to fetch instruments')
      }
      const data = await response.json() as APIResponse<InstrumentType[]>
      return data.result
    } catch (error) {
      console.error('Error fetching instruments:', error)
      throw error
    }
  },

  async getSampleTypes(): Promise<SampleType[]> {
    try {
      const session = await getSession()
      if (!session?.user) {
        throw new Error('No active session found')
      }
      const token = (session.user as any).accessToken
      if (!token) {
        throw new Error('No access token found')
      }
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/sampletype`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!response.ok) {
        throw new Error('Failed to fetch sample types')
      }
      const data = await response.json() as APIResponse<SampleType[]>
      return data.result
    } catch (error) {
      console.error('Error fetching sample types:', error)
      throw error
    }
  },

  async getTests(): Promise<TestType[]> {
    try {
      const session = await getSession()
      if (!session?.user) {
        throw new Error('No active session found')
      }
      const token = (session.user as any).accessToken
      if (!token) {
        throw new Error('No access token found')
      }
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/test`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!response.ok) {
        throw new Error('Failed to fetch tests')
      }
      const data = await response.json() as APIResponse<TestType[]>
      return data.result
    } catch (error) {
      console.error('Error fetching tests:', error)
      throw error
    }
  },

  async addAnalyteCode(analyteCode: AnalyteCodeType): Promise<{ success: boolean; message: string }> {
    try {
      const session = await getSession()
      if (!session?.user) {
        toast.error('No active session found')
        return { success: false, message: 'No active session found' }
      }
      const token = (session.user as any).accessToken
      if (!token) {
        toast.error('No access token found')
        return { success: false, message: 'No access token found' }
      }
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/analytecode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(analyteCode)
      })
      const data = await response.json()
      
      if (!response.ok) {
        toast.error(data?.Message || 'Failed to add analyte code')
        return { success: false, message: data?.Message || 'Failed to add analyte code' }
      }

      toast.success(data?.Message || 'Record created successfully')
      return {
        success: true,
        message: data?.Message || 'Record created successfully'
      }
    } catch (error: any) {
      console.error('Error adding analyte code:', error)
      toast.error(error.message || 'Failed to add analyte code')
      return {
        success: false,
        message: error.message || 'Failed to add analyte code'
      }
    }
  },

  async getAllAnalyteCodes(): Promise<AnalyteCodeType[]> {
    try {
      const session = await getSession()
      if (!session?.user) {
        toast.error('No active session found. Please log in to access this resource.')
        throw new Error('No active session found. Please log in to access this resource.')
      }
      
      const token = (session.user as any).accessToken
      if (!token) {
        toast.error('No access token found. Please log in again.')
        throw new Error('No access token found. Please log in again.')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/analytecode/all`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        toast.error(errorData?.message || `Failed to fetch analyte codes: ${response.status} ${response.statusText}`)
        return []
      }

      const data = await response.json()
      if (!data || !data.result) {
        toast.error('Invalid response format from server')
        throw new Error('Invalid response format from server')  
      }

      return data.result
    } catch (error) {
      console.error('Error in getAllAnalyteCodes:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      throw error
    }
  },

  async updateAnalyteCode(id: number, analyteCode: AnalyteCodeType, reason: string): Promise<void> {
    try {
      const session = await getSession()
      if (!session?.user) {
        throw new Error('No active session found')
      }
      const token = (session.user as any).accessToken
      if (!token) {
        throw new Error('No access token found')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/analytecode/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...analyteCode, reason })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        toast.error(errorData?.message || 'Failed to update record')
        return
      }
      toast.success('Record updated successfully')
    } catch (error) {
      console.error('Error updating analyte code:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update record')
      return
    }
  },

  async deleteAnalyteCode(id: number, reason: string): Promise<{ success: boolean; message: string }> {
    try {
      const session = await getSession()
      if (!session?.user) {
        toast.error('No active session found')
        return { success: false, message: 'No active session found' }
      }
      const token = (session.user as any).accessToken
      if (!token) {
        toast.error('No access token found')
        return { success: false, message: 'No access token found' }
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/analytecode/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        toast.error(errorData?.message || 'Failed to delete analyte code')
        return { success: false, message: errorData?.message || 'Failed to delete analyte code' }
      }

      toast.success('Record deleted successfully')
      return {
        success: true,
        message: 'Record deleted successfully'
      }
    } catch (error) {
      console.error('Error deleting analyte code:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete analyte code')
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete analyte code'
      }
    }
  },

  async downloadFile(fileType: 'CSV' | 'PDF'): Promise<void> {
    try {
      const session = await getSession()
      if (!session?.user) {
        toast.error('No active session found')
        return
      }
      const token = (session.user as any).accessToken
      if (!token) {
        toast.error('No access token found')
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/analytecode/download?fileType=${fileType}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        toast.error(`Failed to download ${fileType} file`)
        return
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `AnalyteCode_List.${fileType.toLowerCase()}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success(`${fileType} file downloaded successfully`)
    } catch (error) {
      console.error(`Error downloading ${fileType} file:`, error)
      toast.error(error instanceof Error ? error.message : `Failed to download ${fileType} file`)
    }
  }
}

export const getAnalyteCodeData = async () => {
  try {
    const response = await analyteCodeService.getAllAnalyteCodes()
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

    const analyteCodes = await analyteCodeService.getAllAnalyteCodes()
    return NextResponse.json({ result: analyteCodes })
  } catch (error: any) {
    console.error('Error in GET /api/apps/lims/Analytecode-master:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analyte codes' },
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
    const result = await analyteCodeService.addAnalyteCode(body)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error in POST /api/apps/lims/Analytecode-master:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add analyte code' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json()
    const result = await analyteCodeService.updateAnalyteCode(body.id, body.analyteCode, body.reason)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const body = await request.json()
    
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 })
    }

    const result = await analyteCodeService.deleteAnalyteCode(Number(id), body.reason)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
