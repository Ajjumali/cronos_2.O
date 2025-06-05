import { authOptions } from '@/libs/auth'
import { getServerSession } from 'next-auth'
import { SpeciesType } from '@/types/apps/limsTypes'
import { NextResponse } from 'next/server'


interface APIResponse<T> {
  result: T
  Status: string
  Message?: string
}

// GET all species
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No active session found. Please log in to access this resource.' },
        { status: 401 }
      )
    }
    const token = (session.user as any).accessToken;
    if (!token) {
      return NextResponse.json({ message: 'No access token found' }, { status: 401 });
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/species/all`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      })
      throw new Error(errorData?.Message || `Failed to fetch species: ${response.status} ${response.statusText}`)
    }

    const data: APIResponse<SpeciesType[]> = await response.json()
    if (!data || !data.result) {
      console.error('Invalid API Response:', data)
      throw new Error('Invalid response format from server')
    }

    return NextResponse.json({ result: data.result })
  } catch (error: any) {
    console.error('Error in GET /api/apps/lims/Species-master:', {
      message: error.message,
      stack: error.stack,
      cause: error.cause
    })
    return NextResponse.json(
      { error: error.message || 'Failed to fetch species' },
      { status: 500 }
    )
  }
}

// POST new species
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No active session found. Please log in to access this resource.' },
        { status: 401 }
      )
    }

    const token = (session.user as any).accessToken;
    if (!token) {
      return NextResponse.json({ message: 'No access token found' }, { status: 401 });
    }

    const body = await request.json()
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/species`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    const data: APIResponse<any> = await response.json()
    
    if (!response.ok) {
      throw new Error(data?.Message || 'Failed to add species')
    }

    return NextResponse.json({
      success: true,
      message: data?.Message || 'Species created successfully'
    })
  } catch (error: any) {
    console.error('Error in POST /api/apps/lims/Species-master:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add species' },
      { status: 500 }
    )
  }
}

// PUT update species
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No active session found. Please log in to access this resource.' },
        { status: 401 }
      )
    }

    const token = (session.user as any).accessToken;
    if (!token) {
      return NextResponse.json({ message: 'No access token found' }, { status: 401 });
    }

    const url = new URL(request.url)
    const id = parseInt(url.pathname.split('/').pop() || '0')
    const body = await request.json()
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/species/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    // Check if response is 204 No Content
    if (response.status === 204) {
      return NextResponse.json({
        success: true,
        message: 'Species updated successfully'
      })
    }

    // If not 204, try to parse error response
    const data = await response.json().catch(() => null)
    if (!response.ok) {
      throw new Error(data?.Message || 'Failed to update species')
    }

    return NextResponse.json({
      success: true,
      message: data?.Message || 'Species updated successfully'
    })
  } catch (error: any) {
    console.error('Error in PUT /api/apps/lims/Species-master:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update species' },
      { status: 500 }
    )
  }
}

// DELETE species
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No active session found. Please log in to access this resource.' },
        { status: 401 }
      )
    }

    const token = (session.user as any).accessToken;
    if (!token) {
      return NextResponse.json({ message: 'No access token found' }, { status: 401 });
    }

    const url = new URL(request.url)
    const id = parseInt(url.pathname.split('/').pop() || '0')
    const reason = url.searchParams.get('reason') || 'No reason provided'
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/species/${id}?reason=${encodeURIComponent(reason)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    const data: APIResponse<any> = await response.json()

    if (!response.ok) {
      throw new Error(data?.Message || `Failed to delete species: ${response.status} ${response.statusText}`)
    }

    return NextResponse.json({
      success: true,
      message: data?.Message || 'Species deleted successfully'
    })
  } catch (error: any) {
    console.error('Error in DELETE /api/apps/lims/Species-master:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete species' },
      { status: 500 }
    )
  }
}
