import { format, parseISO, differenceInDays } from 'date-fns'

/**
 * Format number as Indian Rupee (₹)
 * Example: 18500000 -> ₹ 1,85,00,000
 */
export function formatINR(amount: number, compact = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹ 0'
  }

  if (compact) {
    if (Math.abs(amount) >= 10000000) {
      return `₹ ${(amount / 10000000).toFixed(2)} Cr`
    }
    if (Math.abs(amount) >= 100000) {
      return `₹ ${(amount / 100000).toFixed(2)} L`
    }
    if (Math.abs(amount) >= 1000) {
      return `₹ ${(amount / 1000).toFixed(1)} K`
    }
  }

  // Standard Indian Numbering System formatting (e.g. 1,23,45,678)
  const isNegative = amount < 0
  const absAmount = Math.abs(Math.round(amount)).toString()
  
  let lastThree = absAmount.substring(absAmount.length - 3)
  const otherNumbers = absAmount.substring(0, absAmount.length - 3)
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree
  }
  const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree

  return `${isNegative ? '-' : ''}₹ ${formatted}`
}

/**
 * Format ISO date string to human-readable format (e.g. 15 Oct 2026)
 */
export function formatDate(dateString: string | undefined): string {
  if (!dateString) return '—'
  try {
    const date = parseISO(dateString)
    return format(date, 'dd MMM yyyy')
  } catch {
    return dateString
  }
}

/**
 * Calculate difference in days from today to target date
 */
export function getDaysRemaining(targetDate: string): number {
  try {
    const target = parseISO(targetDate)
    const today = new Date()
    return differenceInDays(target, today)
  } catch {
    return 0
  }
}

/**
 * Calculate timeline in months/days between two dates
 */
export function calculateTimeline(startDate: string, endDate: string): string {
  try {
    const start = parseISO(startDate)
    const end = parseISO(endDate)
    const totalDays = differenceInDays(end, start)
    if (totalDays <= 0) return '0 Days'
    const months = Math.round(totalDays / 30.4)
    if (months > 0) {
      return `${months} ${months === 1 ? 'Month' : 'Months'} (${totalDays}d)`
    }
    return `${totalDays} Days`
  } catch {
    return 'N/A'
  }
}
