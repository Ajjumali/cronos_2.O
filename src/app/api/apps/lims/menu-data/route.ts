import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const token = (session.user as any).accessToken
  const userTypeId = (session.user as any).userTypeId

  if (!userTypeId || !token) {
    return NextResponse.json({ message: 'Missing userTypeId or token' }, { status: 400 })
  }

  try {
    const apiResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/personal/permissions?userTypeId=${userTypeId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!apiResponse.ok) {
      throw new Error(`API responded with status: ${apiResponse.status}`)
    }

    const apiData = await apiResponse.json()
    return NextResponse.json(apiData)
  } catch (error) {
    console.error('Error fetching menu data:', error)
    return NextResponse.json(
      { message: 'Failed to fetch menu data', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
