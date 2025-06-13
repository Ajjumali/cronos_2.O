import { authOptions } from '@/libs/auth'
import { getServerSession } from 'next-auth'
import { StrainType } from '@/types/apps/limsTypes'
import { NextResponse } from 'next/server'

interface APIResponse<T> {
  result: T
  Status: string
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

    const token = (session.user as any).accessToken
    if (!token) {
      return NextResponse.json({ error: 'No access token found. Please log in again.' }, { status: 401 })
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/strain/all`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      return NextResponse.json({ error: errorData?.message || 'Failed to fetch strains' }, { status: response.status })
    }

    const data = await response.json()
    if (!data || !data.result) {
      return NextResponse.json({ error: 'Invalid response format from server' }, { status: 500 })
    }

    return NextResponse.json({ result: data.result })
  } catch (error: any) {
    console.error('Error in GET /api/apps/lims/Strain-master:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch strains' }, { status: 500 })
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

    const token = (session.user as any).accessToken
    if (!token) {
      return NextResponse.json({ error: 'No access token found. Please log in again.' }, { status: 401 })
    }

    const body = await request.json()
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/strain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()
    if (!response.ok) {
      return NextResponse.json({ error: data?.Message || 'Failed to add strain' }, { status: response.status })
    }

    return NextResponse.json({
      success: true,
      message: data?.Message || 'Strain created successfully'
    })
  } catch (error: any) {
    console.error('Error in POST /api/apps/lims/Strain-master:', error)
    return NextResponse.json({ error: error.message || 'Failed to add strain' }, { status: 500 })
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

    const token = (session.user as any).accessToken
    if (!token) {
      return NextResponse.json({ error: 'No access token found. Please log in again.' }, { status: 401 })
    }

    const url = new URL(request.url)
    const id = parseInt(url.pathname.split('/').pop() || '0')
    const body = await request.json()

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/strain/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to update strain' }, { status: response.status })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in PUT /api/apps/lims/Strain-master:', error)
    return NextResponse.json({ error: error.message || 'Failed to update strain' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No active session found. Please log in to access this resource.' },
        { status: 401 }
      )
    }

    const token = (session.user as any).accessToken
    if (!token) {
      return NextResponse.json({ error: 'No access token found. Please log in again.' }, { status: 401 })
    }

    const url = new URL(request.url)
    const id = parseInt(url.pathname.split('/').pop() || '0')
    const reason = url.searchParams.get('reason')

    if (!reason) {
      return NextResponse.json({ error: 'Reason is required for deletion' }, { status: 400 })
    }

    const encodedReason = encodeURIComponent(reason.trim())
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/strain/${id}?reason=${encodedReason}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      return NextResponse.json({ error: errorData?.message || 'Failed to delete strain' }, { status: response.status })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/apps/lims/Strain-master:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete strain' }, { status: 500 })
  }
}

export async function GET_DOWNLOAD(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No active session found. Please log in to access this resource.' },
        { status: 401 }
      )
    }

    const token = (session.user as any).accessToken
    if (!token) {
      return NextResponse.json({ error: 'No access token found. Please log in again.' }, { status: 401 })
    }

    const url = new URL(request.url)
    const fileType = url.searchParams.get('fileType')

    if (!fileType || !['PDF', 'CSV'].includes(fileType)) {
      return NextResponse.json({ error: 'Invalid file type. Must be PDF or CSV' }, { status: 400 })
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/strain/download?fileType=${fileType}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to download ${fileType} file` }, { status: response.status })
    }

    const blob = await response.blob()
    return new NextResponse(blob, {
      headers: {
        'Content-Type': fileType === 'PDF' ? 'application/pdf' : 'text/csv',
        'Content-Disposition': `attachment; filename=Strain_List.${fileType.toLowerCase()}`
      }
    })
  } catch (error: any) {
    console.error('Error in GET_DOWNLOAD /api/apps/lims/Strain-master:', error)
    return NextResponse.json({ error: error.message || 'Failed to download file' }, { status: 500 })
  }
}
