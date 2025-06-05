import { AuditTrailType } from '@/components/audit-trail/AuditTrailDialog'

export const createAuditTrail = async (
  userId: number,
  type: string,
  tableName: string,
  oldValues: any,
  newValues: any,
  affectedColumns: string[],
  primaryKey: string | number
): Promise<void> => {
  try {
    const auditTrail: Omit<AuditTrailType, 'id'> = {
      userId,
      type,
      tableName,
      dateTime: new Date().toISOString(),
      oldValues: JSON.stringify(oldValues),
      newValues: JSON.stringify(newValues),
      affectedColumns: affectedColumns.join(', '),
      primaryKey: primaryKey.toString()
    }

    // TODO: Replace with your actual API endpoint
    await fetch('/api/audit-trail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(auditTrail)
    })
  } catch (error) {
    console.error('Failed to create audit trail:', error)
    // Don't throw the error to prevent disrupting the main operation
  }
}

export const getAuditTrails = async (
  tableName: string,
  recordId: number
): Promise<AuditTrailType[]> => {
  try {
    // TODO: Replace with your actual API endpoint
    const response = await fetch(`/api/audit-trail/${tableName}/${recordId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch audit trails')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching audit trails:', error)
    throw error
  }
}

// Helper function to compare objects and get changed fields
export const getChangedFields = (oldObj: any, newObj: any): string[] => {
  const changes: string[] = []
  
  for (const key in newObj) {
    if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
      changes.push(key)
    }
  }
  
  return changes
}

// Helper function to get old and new values for changed fields
export const getChangedValues = (oldObj: any, newObj: any, changedFields: string[]): { old: any; new: any } => {
  const old: any = {}
  const new_: any = {}
  
  changedFields.forEach(field => {
    old[field] = oldObj[field]
    new_[field] = newObj[field]
  })
  
  return { old, new: new_ }
} 