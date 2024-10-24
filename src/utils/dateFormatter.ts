// utils/dateFormatter.ts

/**
 * Formats a date into a localized string with various options
 * @param date - Date to format
 * @param format - Optional format specification ('short', 'long', or 'full')
 * @param locale - Optional locale string (defaults to 'en-US')
 * @returns Formatted date string
 */
export const formatDate = (
    date: Date,
    format: 'short' | 'long' | 'full' = 'long',
    locale: string = 'en-US'
  ): string => {
    try {
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: format === 'short' ? '2-digit' : 'long',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      };
  
      // Add seconds for full format
      if (format === 'full') {
        options.second = '2-digit';
      }
  
      return new Intl.DateTimeFormat(locale, options).format(date);
    } catch (error) {
      // Fallback formatting if Intl is not available
      return date.toLocaleString(locale);
    }
  };
  
  // Example formats:
  // formatDate(new Date()) → "January 24, 2024, 02:30 PM"
  // formatDate(new Date(), 'short') → "01/24/24, 02:30 PM"
  // formatDate(new Date(), 'full') → "January 24, 2024, 02:30:45 PM"