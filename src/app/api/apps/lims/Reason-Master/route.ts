import { authOptions } from '@/libs/auth'
import { getServerSession } from 'next-auth'
import { ReasonType } from '@/types/apps/limsTypes'
import { NextResponse } from 'next/server'

interface APIResponse<T> {
  result: T
  Status: string
}

// GET /api/apps/lims/reason-master
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No active session found. Please log in to access this resource.' },
        { status: 401 }
      )
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/reason/all`, {
      headers: {
        Authorization: `Bearer ${(session.user as any).accessToken}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.message || 'Failed to fetch reasons')
    }

    const data = await response.json()
    if (!data || !data.result) {
      throw new Error('Invalid response format from server')
    }

    return NextResponse.json({ result: data.result })
  } catch (error: any) {
    console.error('Error in GET /api/apps/lims/reason-master:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch data' }, { status: 500 })
  }
}

// POST /api/apps/lims/reason-master
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
    const { reason, ...reasonData } = body

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/reason?reason=${encodeURIComponent(reason || '')}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(session.user as any).accessToken}`
        },
        body: JSON.stringify(reasonData)
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data?.Message || 'Failed to add reason')
    }

    return NextResponse.json({
      success: true,
      message: data?.Message || 'Reason created successfully',
      data: data?.Result
    })
  } catch (error: any) {
    console.error('Error in POST /api/apps/lims/reason-master:', error)
    return NextResponse.json({ error: error.message || 'Failed to add reason' }, { status: 500 })
  }
}

// PUT /api/apps/lims/reason-master/[id]
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
    const { reason, ...reasonData } = body

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/reason/${id}?reason=${encodeURIComponent(reason || '')}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(session.user as any).accessToken}`
        },
        body: JSON.stringify(reasonData)
      }
    )

    if (response.status === 404) {
      return NextResponse.redirect(new URL('/auth/login?signout=true', request.url))
    }

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data?.Message || 'Failed to update reason')
    }

    return NextResponse.json({
      success: true,
      message: data?.Message || 'Reason updated successfully',
      data: data?.Result
    })
  } catch (error: any) {
    console.error('Error in PUT /api/apps/lims/reason-master:', error)
    return NextResponse.json({ error: error.message || 'Failed to update reason' }, { status: 500 })
  }
}

// DELETE /api/apps/lims/reason-master/[id]
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
      `${process.env.NEXT_PUBLIC_API_URL}/v1/reason/${id}?reason=${encodeURIComponent(reason)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${(session.user as any).accessToken}`
        }
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.message || 'Failed to delete reason')
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/apps/lims/reason-master:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete reason' }, { status: 500 })
  }
}
