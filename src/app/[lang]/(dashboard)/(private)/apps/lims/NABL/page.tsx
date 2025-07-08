'use client'

// MUI Imports
import Grid from '@mui/material/Grid2'
import { useState, useEffect, useRef } from 'react'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import { Add } from '@mui/icons-material'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Fade, Slide } from '@mui/material'

// Component Imports
import NablListTable from '@/views/apps/lims/NABL/NablListTable'
import AccreditationForm from '@/views/apps/lims/NABL/AccreditationForm'
import { nablService } from '@/app/api/apps/lims/NABL/service'
import { AccreditationDetail } from '@/app/api/apps/lims/types'

type ViewMode = 'list' | 'form'

const NABLPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [accreditationData, setAccreditationData] = useState<AccreditationDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [formParams, setFormParams] = useState<{
    id?: string
    copyData?: string
    isEdit?: boolean
    isCopy?: boolean
  }>({})
  const [isNavigating, setIsNavigating] = useState(false)
  const navigationRef = useRef(false)

  const fetchAccreditations = async () => {
    try {
      setLoading(true)
      const data = await nablService.getAllAccreditations()
      setAccreditationData(data)
    } catch (error) {
      console.error('Error fetching accreditations:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccreditations()
  }, [])

  // Handle URL parameters for initial load and browser navigation
  useEffect(() => {
    // Skip if this is a programmatic navigation
    if (navigationRef.current) {
      return
    }

    const id = searchParams.get('id')
    const copyData = searchParams.get('data')
    const isEdit = searchParams.get('edit') === 'true'
    const isCopy = searchParams.get('copy') === 'true'

    // Determine view mode based on URL parameters
    const shouldShowForm = id || copyData || isEdit || isCopy

    if (shouldShowForm) {
      setViewMode('form')
      setFormParams({ id: id || undefined, copyData: copyData || undefined, isEdit, isCopy })
    } else {
      setViewMode('list')
      setFormParams({})
    }
  }, [searchParams, pathname])

  // Handle browser back/forward button navigation
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Prevent default behavior and handle navigation manually
      // The searchParams effect will handle the state update automatically
      console.log('Browser navigation detected:', window.location.href)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const handleNavigateToList = () => {
    navigationRef.current = true
    setIsNavigating(true)
    setViewMode('list')
    setFormParams({})
    // Update URL with proper history entry
    router.push('/apps/lims/NABL', { scroll: false })
    // Reset navigation state after a short delay
    setTimeout(() => {
      setIsNavigating(false)
      navigationRef.current = false
    }, 100)
  }

  const handleNavigateToForm = (params: { id?: string; copyData?: string; isEdit?: boolean; isCopy?: boolean }) => {
    navigationRef.current = true
    setIsNavigating(true)
    setViewMode('form')
    setFormParams(params)

    // Update URL with proper history entry
    const url = new URL(window.location.href)
    if (params.id) url.searchParams.set('id', params.id)
    if (params.copyData) url.searchParams.set('data', params.copyData)
    if (params.isEdit) url.searchParams.set('edit', 'true')
    if (params.isCopy) url.searchParams.set('copy', 'true')

    router.push(url.pathname + url.search, { scroll: false })
    // Reset navigation state after a short delay
    setTimeout(() => {
      setIsNavigating(false)
      navigationRef.current = false
    }, 100)
  }

  const handleDataChange = () => {
    fetchAccreditations()
  }

  if (loading && viewMode === 'list') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  // Show loading during navigation to prevent flickering
  if (isNavigating) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={40} />
      </Box>
    )
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Fade in={true} timeout={300}>
          <div>
            {viewMode === 'list' ? (
              <Slide direction='right' in={viewMode === 'list'} timeout={300}>
                <Card>
                  <CardContent>
                    <NablListTable
                      accreditationData={accreditationData}
                      onDataChange={handleDataChange}
                      onNavigateToForm={handleNavigateToForm}
                    />
                  </CardContent>
                </Card>
              </Slide>
            ) : (
              <Slide direction='left' in={viewMode === 'form'} timeout={300}>
                <div>
                  <AccreditationForm onNavigateToList={handleNavigateToList} formParams={formParams} />
                </div>
              </Slide>
            )}
          </div>
        </Fade>
      </Grid>
    </Grid>
  )
}

export default NABLPage
