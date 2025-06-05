import { AccreditationDetail } from '../types'

const API_BASE_URL = '/api/apps/lims/NABL'

export const nablService = {
  // Get all accreditations
  getAllAccreditations: async (): Promise<AccreditationDetail[]> => {
    const response = await fetch(API_BASE_URL)
    if (!response.ok) {
      throw new Error('Failed to fetch accreditations')
    }
    return response.json()
  },

  // Create new accreditation
  createAccreditation: async (data: Omit<AccreditationDetail, 'id'>): Promise<AccreditationDetail> => {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error('Failed to create accreditation')
    }
    return response.json()
  },

  // Update accreditation
  updateAccreditation: async (data: AccreditationDetail): Promise<AccreditationDetail> => {
    const response = await fetch(API_BASE_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error('Failed to update accreditation')
    }
    return response.json()
  },

  // Delete accreditation
  deleteAccreditation: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}?id=${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error('Failed to delete accreditation')
    }
  }
} 