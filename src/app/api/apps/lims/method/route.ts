import { NextResponse } from 'next/server'
import type { MethodType } from '@/types/apps/limsTypes'

// Dummy data for testing
let methods: MethodType[] = [
  {
    methodId: 1,
    methodName: 'HPLC Analysis',
    description: 'High Performance Liquid Chromatography method for compound analysis',
    isActive: true,
    updatedBy: 'System',
    updatedOn: new Date().toISOString()
  },
  {
    methodId: 2,
    methodName: 'GC-MS Analysis',
    description: 'Gas Chromatography-Mass Spectrometry method for volatile compound analysis',
    isActive: true,
    updatedBy: 'System',
    updatedOn: new Date().toISOString()
  }
]

export const methodService = {
  // Get all methods
  getMethods: async () => {
    return methods
  },

  // Get method by ID
  getMethodById: async (id: number) => {
    return methods.find(method => method.methodId === id)
  },

  // Create new method
  createMethod: async (method: Omit<MethodType, 'methodId' | 'updatedBy' | 'updatedOn'>) => {
    const newMethod: MethodType = {
      methodId: methods.length + 1,
      ...method,
      updatedBy: 'System', // This should be replaced with actual user
      updatedOn: new Date().toISOString()
    }
    methods.push(newMethod)
    return newMethod
  },

  // Update method
  updateMethod: async (id: number, method: Partial<MethodType> & { reason?: string }) => {
    const index = methods.findIndex(m => m.methodId === id)
    if (index === -1) throw new Error('Method not found')

    const updatedMethod = {
      ...methods[index],
      ...method,
      updatedOn: new Date().toISOString()
    }
    methods[index] = updatedMethod
    return updatedMethod
  },

  // Delete method
  deleteMethod: async (id: number, reason: string) => {
    const index = methods.findIndex(m => m.methodId === id)
    if (index === -1) throw new Error('Method not found')

    methods = methods.filter(m => m.methodId !== id)
    return { success: true }
  },

  // Download file
  downloadFile: async (format: 'CSV' | 'PDF') => {
    // This is a dummy implementation
    return { success: true }
  }
}

// API Routes
export async function GET() {
  try {
    const methods = await methodService.getMethods()
    return NextResponse.json(methods)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch methods' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const method = await request.json()
    const newMethod = await methodService.createMethod(method)
    return NextResponse.json(newMethod)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create method' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...method } = await request.json()
    const updatedMethod = await methodService.updateMethod(id, method)
    return NextResponse.json(updatedMethod)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update method' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { id, reason } = await request.json()
    await methodService.deleteMethod(id, reason)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete method' }, { status: 500 })
  }
}
