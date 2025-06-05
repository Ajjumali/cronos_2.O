/**
 * Formats a date string or Date object into the specified format
 * @param date - Date string or Date object to format
 * @param format - Format type ('default' | 'short' | 'long' | 'time')
 * @returns Formatted date string
 */
export const formatDate = (date: string | Date | null | undefined, format: 'default' | 'short' | 'long' | 'time' = 'default'): string => {
  if (!date) return '-'

  const dateObj = typeof date === 'string' ? new Date(date) : date

  const formats: Record<string, Intl.DateTimeFormatOptions> = {
    default: {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    short: {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    },
    long: {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    },
    time: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }
  }

  return dateObj.toLocaleString('en-GB', formats[format]).replace(',', '')
}

/**
 * Formats a date to display only the date part (DD-MMM-YYYY)
 */
export const formatDateOnly = (date: string | Date | null | undefined): string => {
  return formatDate(date, 'short')
}

/**
 * Formats a date to display only the time part (HH:mm)
 */
export const formatTimeOnly = (date: string | Date | null | undefined): string => {
  return formatDate(date, 'time')
}

/**
 * Formats a date to display full date and time (DD-MMM-YYYY HH:mm:ss)
 */
export const formatDateTime = (date: string | Date | null | undefined): string => {
  return formatDate(date, 'long')
} 