import React, { useState, useEffect } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import { toast } from 'react-toastify'
import AuditTrailDialog from '@/components/audit-trail/AuditTrailDialog'
import { createAuditTrail, getChangedFields, getChangedValues } from '@/utils/auditTrail'
import HistoryIcon from '@mui/icons-material/History'

interface SampleRegistrationDialogProps {
  open: boolean
  onClose: () => void
  sampleId?: number
  // Add other props as needed
}

const SampleRegistrationDialog: React.FC<SampleRegistrationDialogProps> = ({
  open,
  onClose,
  sampleId,
  // ... other props ...
}) => {
  // ... existing state ...
  const [showAuditTrail, setShowAuditTrail] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: number; name: string } | null>(null)

  useEffect(() => {
    // Fetch current user info
    const fetchCurrentUser = async () => {
      try {
        // TODO: Replace with your actual API endpoint
        const response = await fetch('/api/current-user')
        const userData = await response.json()
        setCurrentUser(userData)
      } catch (error) {
        console.error('Failed to fetch current user:', error)
      }
    }
    fetchCurrentUser()
  }, [])

  const handleSave = async () => {
    try {
      if (sampleId) {
        // Update existing sample
        const oldData = { /* fetch existing data */ }
        const newData = { /* your new data */ }
        
        const changedFields = getChangedFields(oldData, newData)
        const { old, new: new_ } = getChangedValues(oldData, newData, changedFields)

        // Create audit trail
        if (currentUser && changedFields.length > 0) {
          await createAuditTrail(
            currentUser.id,
            'Updated',
            'SampleRegistration',
            old,
            new_,
            changedFields,
            sampleId
          )
        }

        // Update the sample
        // ... your existing update logic ...
      } else {
        // Create new sample
        const newData = { /* your new data */ }
        
        // Create audit trail
        if (currentUser) {
          await createAuditTrail(
            currentUser.id,
            'Created',
            'SampleRegistration',
            {},
            newData,
            Object.keys(newData),
            'new'
          )
        }

        // Create the sample
        // ... your existing create logic ...
      }
    } catch (error) {
      console.error('Error saving sample:', error)
      toast.error('Failed to save sample')
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {sampleId ? 'Edit Sample Registration' : 'New Sample Registration'}
          {sampleId && (
            <IconButton
              onClick={() => setShowAuditTrail(true)}
              sx={{ float: 'right' }}
              title="View Audit Trail"
            >
              <HistoryIcon />
            </IconButton>
          )}
        </DialogTitle>
        {/* ... rest of your dialog content ... */}
      </Dialog>

      {sampleId && (
        <AuditTrailDialog
          open={showAuditTrail}
          onClose={() => setShowAuditTrail(false)}
          recordId={sampleId}
          moduleName="Sample Registration"
          fetchAuditTrails={async (id) => {
            const response = await fetch(`/api/audit-trail/SampleRegistration/${id}`)
            return response.json()
          }}
        />
      )}
    </>
  )
}

export default SampleRegistrationDialog 