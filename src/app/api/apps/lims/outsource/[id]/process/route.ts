import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status } = body

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/outsource/${params.id}/process`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status,
          processedDate: new Date().toISOString()
        })
      }
    )

    if (!response.ok) {
      throw new Error('Failed to update processing status')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating processing status:', error)
    return NextResponse.json(
      { error: 'Failed to update processing status' },
      { status: 500 }
    )
  }
} 