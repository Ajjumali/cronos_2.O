import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { trackingId, status } = body

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/outsource/${params.id}/shipment`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          trackingId,
          status,
          shipmentDate: new Date().toISOString()
        })
      }
    )

    if (!response.ok) {
      throw new Error('Failed to update shipment status')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating shipment status:', error)
    return NextResponse.json(
      { error: 'Failed to update shipment status' },
      { status: 500 }
    )
  }
} 