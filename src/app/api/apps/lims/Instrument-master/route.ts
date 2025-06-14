import { authOptions } from '@/libs/auth'
import { getServerSession } from 'next-auth'
import { Category, InstrumentType } from '@/types/apps/limsTypes'
import { NextResponse } from 'next/server'

interface APIResponse<T> {
  result: T
  Status: string
}

// GET /api/apps/lims/Instrument-master
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No active session found. Please log in to access this resource.' },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const path = url.pathname.split('/').pop()

    // Handle download endpoint
    if (path === 'download') {
      const fileType = url.searchParams.get('fileType') as 'CSV' | 'PDF'
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/instrument/download?fileType=${fileType}`, {
        headers: {
          Authorization: `Bearer ${(session.user as any).accessToken}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to download file')
      }

      const blob = await response.blob()
      return new NextResponse(blob, {
        headers: {
          'Content-Type': fileType === 'CSV' ? 'text/csv' : 'application/pdf',
          'Content-Disposition': `attachment; filename=Instrument_${new Date().toISOString().replace(/[:.]/g, '_')}.${fileType.toLowerCase()}`
        }
      })
    }

    // Default endpoint - get all instruments
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/instrument/all`, {
      headers: {
        Authorization: `Bearer ${(session.user as any).accessToken}`,
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

    return NextResponse.json({ result: data.result })
  } catch (error: any) {
    console.error('Error in GET /api/apps/lims/Instrument-master:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch data' }, { status: 500 })
  }
}

// POST /api/apps/lims/Instrument-master
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
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/instrument`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${(session.user as any).accessToken}`
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data?.Message || 'Failed to add instrument')
    }

    return NextResponse.json({
      success: true,
      message: data?.Message || 'Instrument created successfully',
      data: data?.Result
    })
  } catch (error: any) {
    console.error('Error in POST /api/apps/lims/Instrument-master:', error)
    return NextResponse.json({ error: error.message || 'Failed to add instrument' }, { status: 500 })
  }
}

// PUT /api/apps/lims/Instrument-master/[id]
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
        Authorization: `Bearer ${(session.user as any).accessToken}`
      },
      body: JSON.stringify(body)
    })

    if (response.status === 404) {
      return NextResponse.redirect(new URL('/auth/login?signout=true', request.url))
    }

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data?.Message || 'Failed to update instrument')
    }

    return NextResponse.json({
      success: true,
      message: data?.Message || 'Instrument updated successfully',
      data: data?.Result
    })
  } catch (error: any) {
    console.error('Error in PUT /api/apps/lims/Instrument-master:', error)
    return NextResponse.json({ error: error.message || 'Failed to update instrument' }, { status: 500 })
  }
}

// DELETE /api/apps/lims/Instrument-master/[id]
export async function DELETE(request: Request) {
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
    const reason = url.searchParams.get('reason') || ''

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/instrument/${id}?reason=${encodeURIComponent(reason)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${(session.user as any).accessToken}`
        }
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.message || 'Failed to delete instrument')
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/apps/lims/Instrument-master:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete instrument' }, { status: 500 })
  }
}
