import { authOptions } from '@/libs/auth'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

// GET download file
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
    const fileType = url.searchParams.get('fileType') || 'CSV'

    const response = await fetch(`${API_BASE_URL}/v1/species/download?fileType=${fileType}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to download ${fileType} file`)
    }

    const blob = await response.blob()
    return new NextResponse(blob, {
      headers: {
        'Content-Type': fileType === 'PDF' ? 'application/pdf' : 'text/csv',
        'Content-Disposition': `attachment; filename=Species_List.${fileType.toLowerCase()}`
      }
    })
  } catch (error: any) {
    console.error(`Error in GET /api/apps/lims/Species-master/download:`, error)
    return NextResponse.json(
      { error: error.message || `Failed to download file` },
      { status: 500 }
    )
  }
} 