import { authOptions } from '@/libs/auth'
import { getServerSession } from 'next-auth'
import { AnalyteCodeType, InstrumentType, SampleType, TestType } from '@/types/apps/limsTypes'
import { NextResponse } from 'next/server'

interface APIResponse<T> {
  result: T
  Status: string
}

// Helper function to get auth token
const getAuthToken = async () => {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    throw new Error('No active session found')
  }
  const token = (session.user as any).accessToken
  if (!token) {
    throw new Error('No access token found')
  }
  return token
}

// GET /api/apps/lims/Analytecode-master
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get('endpoint')
    const fileType = searchParams.get('fileType')

    const token = await getAuthToken()

    // Handle file download
    if (fileType === 'download') {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/analytecode/download?fileType=${searchParams.get('type')}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to download file`)
      }

      const blob = await response.blob()
      return new NextResponse(blob, {
        headers: {
          'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="AnalyteCode_List.${searchParams.get('type')?.toLowerCase()}"`
        }
      })
    }

    // Handle other GET requests
    switch (endpoint) {
      case 'instruments': {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/instrument/all`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!response.ok) throw new Error('Failed to fetch instruments')
        const data = (await response.json()) as APIResponse<InstrumentType[]>
        return NextResponse.json(data.result)
      }

      case 'sampletypes': {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/sampletype`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!response.ok) throw new Error('Failed to fetch sample types')
        const data = (await response.json()) as APIResponse<SampleType[]>
        return NextResponse.json(data.result)
      }

      case 'tests': {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/test`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!response.ok) throw new Error('Failed to fetch tests')
        const data = (await response.json()) as APIResponse<TestType[]>
        return NextResponse.json(data.result)
      }

      default: {
        // Default endpoint - get all analyte codes
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/analytecode/all`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          cache: 'no-store'
        })
        if (!response.ok) throw new Error('Failed to fetch analyte codes')
        const data = await response.json()
        return NextResponse.json(data.result)
      }
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// POST /api/apps/lims/Analytecode-master
export async function POST(request: Request) {
  try {
    const token = await getAuthToken()
    const body = await request.json()

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/analytecode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()
    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data?.Message || 'Failed to add analyte code' },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: data?.Message || 'Record created successfully'
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to add analyte code' },
      { status: 500 }
    )
  }
}

// PUT /api/apps/lims/Analytecode-master
export async function PUT(request: Request) {
  try {
    const token = await getAuthToken()
    const body = await request.json()
    const { id, analyteCode, reason } = body

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/analytecode/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ ...analyteCode, reason })
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { success: false, message: errorData?.message || 'Failed to update record' },
        { status: response.status }
      )
    }

    return NextResponse.json({ success: true, message: 'Record updated successfully' })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to update record' }, { status: 500 })
  }
}

// DELETE /api/apps/lims/Analytecode-master
export async function DELETE(request: Request) {
  try {
    const token = await getAuthToken()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const body = await request.json()

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 })
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/analytecode/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ reason: body.reason })
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { success: false, message: errorData?.message || 'Failed to delete analyte code' },
        { status: response.status }
      )
    }

    return NextResponse.json({ success: true, message: 'Record deleted successfully' })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete analyte code' },
      { status: 500 }
    )
  }
}
