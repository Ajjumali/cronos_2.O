import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/libs/auth';
import { getSession } from 'next-auth/react'

interface APIErrorResult {
  message: string;
}

interface APIResult<T> {
  result: T;
  status: string;
  message?: string;
}

export const testResultsService = {
  async downloadFile(fileType: 'CSV' | 'PDF'): Promise<Blob> {
    try {
      const session = await getSession()
      if (!session?.user) {
        throw new Error('No active session found')
      }
      const token = (session.user as any).accessToken
      if (!token) {
        throw new Error('No access token found')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/testresult/download?fileType=${fileType}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to download file')
      }

      const contentType = fileType === 'CSV' ? 'text/csv' : 'application/pdf'
      const timestamp = new Date().toISOString().replace(/[:.]/g, '_')
      const fileName = `Test_Results_${timestamp}.${fileType.toLowerCase()}`

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      return blob
    } catch (error) {
      console.error('Error downloading file:', error)
      throw error
    }
  },

  async updateStatus(ids: number[], statusId: number, reason?: string): Promise<APIResult<boolean>> {
    try {
      const session = await getSession()
      if (!session?.user) {
        throw new Error('No active session found')
      }
      const token = (session.user as any).accessToken
      if (!token) {
        throw new Error('No access token found')
      }

      if (statusId === 2 && !reason) {
        throw new Error('Reason is required for rejection')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/testresult/update-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ids,
          statusId,
          reason
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update status')
      }

      return await response.json()
    } catch (error) {
      console.error('Error updating status:', error)
      throw error
    }
  },

  async updateRemark(id: number, remark: string): Promise<APIResult<boolean>> {
    try {
      const session = await getSession()
      if (!session?.user) {
        throw new Error('No active session found')
      }
      const token = (session.user as any).accessToken
      if (!token) {
        throw new Error('No access token found')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/testresult/update-remark`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id,
          remark
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update remark')
      }

      return await response.json()
    } catch (error) {
      console.error('Error updating remark:', error)
      throw error
    }
  },

  async getTestTypes() {
    try {
      const session = await getSession()
      if (!session?.user) {
        throw new Error('No active session found')
      }
      const token = (session.user as any).accessToken
      if (!token) {
        throw new Error('No access token found')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/testtype`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch test types')
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching test types:', error)
      throw error
    }
  },

  async getTestDetails(id: string | number): Promise<APIResult<any>> {
    try {
      const session = await getSession()
      if (!session?.user) {
        throw new Error('No active session found')
      }
      const token = (session.user as any).accessToken
      if (!token) {
        throw new Error('No access token found')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/testresult/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch test details')
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching test details:', error)
      throw error
    }
  },

  async getTestResults() {
    try {
      const session = await getSession()
      if (!session?.user) {
        throw new Error('No active session found')
      }
      const token = (session.user as any).accessToken
      if (!token) {
        throw new Error('No access token found')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/testresult/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch test results')
      }

      const data = await response.json()
      return data.result
    } catch (error) {
      console.error('Error fetching test results:', error)
      throw error
    }
  }
}

/**
 * Test Results API Endpoints
 * 
 * GET /api/apps/lims/Test-results
 * Query Parameters:
 * - id (optional): Get specific test result by ID
 * 
 * Example usage:
 * - Get all test results: GET /api/apps/lims/Test-results
 * - Get specific test result: GET /api/apps/lims/Test-results?id=123
 * 
 * Response format:
 * - Success: { result: TestResult[] | TestResult, status: string }
 * - Error: { message: string }
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const token = (session.user as any).accessToken
    if (!token) {
      return NextResponse.json({ message: 'No access token found' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/testresults/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        return NextResponse.json({ message: error.message || 'Failed to fetch test details' }, { status: response.status })
      }

      const data = await response.json()
      return NextResponse.json(data)
    }

    // If no id is provided, fetch all test results
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/testresult/all`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ message: error.message || 'Failed to fetch test results' }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data.result)
  } catch (error) {
    console.error('Error in test results API route:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Service Methods Documentation
 * 
 * 1. downloadFile(fileType: 'CSV' | 'PDF')
 *    Downloads test results in specified format
 *    Usage: await testResultsService.downloadFile('CSV')
 * 
 * 2. updateStatus(ids: number[], statusId: number, reason?: string)
 *    Updates status of test results
 *    Usage: await testResultsService.updateStatus([1, 2, 3], 2, 'Rejection reason')
 * 
 * 3. updateRemark(id: number, remark: string)
 *    Updates remark for a specific test result
 *    Usage: await testResultsService.updateRemark(1, 'New remark')
 * 
 * 4. getTestTypes()
 *    Fetches all available test types
 *    Usage: await testResultsService.getTestTypes()
 * 
 * 5. getTestDetails(id: string | number)
 *    Fetches detailed information for a specific test
 *    Usage: await testResultsService.getTestDetails(123)
 * 
 * 6. getTestResults()
 *    Fetches all test results
 *    Usage: await testResultsService.getTestResults()
 */
