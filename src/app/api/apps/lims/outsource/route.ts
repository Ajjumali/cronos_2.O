import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No active session found. Please log in to access this resource.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'download') {
      const { fileType } = await request.json()
      const token = (session.user as any).accessToken

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/outsource/download?fileType=${fileType}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to download file')
      }

      const blob = await response.blob()
      return new NextResponse(blob, {
        headers: {
          'Content-Type':
            fileType === 'EXCEL' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv',
          'Content-Disposition': `attachment; filename="Outsource_List_${new Date().toISOString().replace(/[:.]/g, '_')}.${fileType.toLowerCase()}"`
        }
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Error in POST /api/apps/lims/outsource:', error)
    return NextResponse.json({ error: error.message || 'Failed to process request' }, { status: 500 })
  }
}
