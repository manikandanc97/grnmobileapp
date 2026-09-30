import { parseISO, startOfMonth, startOfWeek, endOfWeek, addMonths, subMonths } from 'date-fns';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';

const TIMEZONE = 'Asia/Kolkata';

/**
 * Returns the current date in the target timezone as a local Date object 
 * that can be used with other date-fns functions.
 */
export const getToday = (): Date => {
  return toZonedTime(new Date(), TIMEZONE);
};

export const getStartOfMonth = (date: Date = getToday()): Date => {
  return startOfMonth(date);
};

export const getStartOfNextMonth = (date: Date = getToday()): Date => {
  return startOfMonth(addMonths(date, 1));
};

export const getStartOfPreviousMonth = (date: Date = getToday()): Date => {
  return startOfMonth(subMonths(date, 1));
};

export const getStartOfWeek = (date: Date = getToday()): Date => {
  return startOfWeek(date, { weekStartsOn: 1 }); // Monday
};

export const getEndOfWeek = (date: Date = getToday()): Date => {
  return endOfWeek(date, { weekStartsOn: 1 });
};

/**
 * Formats a Date object or ISO string to a specific string format in the target timezone.
 */
export const formatDate = (date: Date | string, formatStr: string = 'dd MMM yyyy'): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(d, TIMEZONE, formatStr);
};

export const formatDateRange = (start: Date | string, end: Date | string): string => {
  return `${formatDate(start)} - ${formatDate(end)}`;
};

/**
 * Parses an ISO date string (YYYY-MM-DD or full ISO) into a timezone-safe local Date object
 * for comparison and filtering. Fully resilient against null, undefined, or malformed strings.
 */
export const parseSafeDate = (dateStr?: string | null): Date | null => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  try {
    // If format starts with YYYY-MM-DD
    const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      return new Date(year, month, day, 0, 0, 0, 0);
    }
    const parsed = parseISO(trimmed);
    if (!isNaN(parsed.getTime())) {
      return toZonedTime(parsed, TIMEZONE);
    }
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
};

/**
 * Checks if a given date string (e.g. '2026-09-28') falls within the specified interval.
 */
export const isDateWithinInterval = (
  dateStr?: string | null,
  start?: Date,
  end?: Date,
  exclusiveEnd = false
): boolean => {
  const date = parseSafeDate(dateStr);
  if (!date || !start || !end) return false;
  if (exclusiveEnd) {
    return date >= start && date < end;
  }
  return date >= start && date <= end;
};

/**
 * Normalizes any date input (string YYYY-MM-DD or ISO) into a strict local DATE string 'YYYY-MM-DD'
 * in Asia/Kolkata timezone.
 */
export const normalizeExpenseDateStr = (dateStr?: string | null): string | null => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  const parsed = parseSafeDate(trimmed);
  if (!parsed) return null;
  return formatInTimeZone(parsed, TIMEZONE, 'yyyy-MM-dd');
};

/**
 * Checks if date falls in current calendar month in the app's timezone.
 * Uses: expense_date >= currentMonthStart AND expense_date < nextMonthStart
 */
export const isDateInCurrentMonth = (dateStr?: string | null): boolean => {
  const norm = normalizeExpenseDateStr(dateStr);
  if (!norm) return false;
  const today = getToday();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const currentMonthStart = `${year}-${month}-01`;
  const nextMonthDate = addMonths(today, 1);
  const nextMonthYear = nextMonthDate.getFullYear();
  const nextMonth = String(nextMonthDate.getMonth() + 1).padStart(2, '0');
  const nextMonthStart = `${nextMonthYear}-${nextMonth}-01`;
  return norm >= currentMonthStart && norm < nextMonthStart;
};

/**
 * Checks if date falls in previous calendar month in the app's timezone.
 * Uses: expense_date >= prevMonthStart AND expense_date < currentMonthStart
 */
export const isDateInPreviousMonth = (dateStr?: string | null): boolean => {
  const norm = normalizeExpenseDateStr(dateStr);
  if (!norm) return false;
  const today = getToday();
  const prevMonthDate = subMonths(today, 1);
  const prevMonthYear = prevMonthDate.getFullYear();
  const prevMonth = String(prevMonthDate.getMonth() + 1).padStart(2, '0');
  const prevMonthStart = `${prevMonthYear}-${prevMonth}-01`;
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const currentMonthStart = `${year}-${month}-01`;
  return norm >= prevMonthStart && norm < currentMonthStart;
};

/**
 * Checks if date falls on today's calendar date in the app's timezone (India).
 * Uses exact DATE equality (e.g. '2026-09-29').
 */
export const isDateToday = (dateStr?: string | null): boolean => {
  const norm = normalizeExpenseDateStr(dateStr);
  if (!norm) return false;
  const today = getToday();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;
  return norm === todayStr;
};

/**
 * Checks if date falls in current calendar week (Monday to Sunday).
 */
export const isDateInCurrentWeek = (dateStr?: string | null): boolean => {
  const norm = normalizeExpenseDateStr(dateStr);
  if (!norm) return false;
  const today = getToday();
  const startWeek = getStartOfWeek(today);
  const endWeek = getEndOfWeek(today);
  const startStr = formatInTimeZone(startWeek, TIMEZONE, 'yyyy-MM-dd');
  const nextDay = new Date(endWeek.getFullYear(), endWeek.getMonth(), endWeek.getDate() + 1);
  const exclusiveEndStr = formatInTimeZone(nextDay, TIMEZONE, 'yyyy-MM-dd');
  return norm >= startStr && norm < exclusiveEndStr;
};

/**
 * Checks if date falls in custom range with exclusive end-date logic.
 * Query: >= startDate AND < (endDate + 1 day).
 * Example: 01/09/2026 -> 29/09/2026 is evaluated as:
 * expense_date >= '2026-09-01' AND expense_date < '2026-09-30'
 */
export const isDateInCustomRange = (
  dateStr?: string | null,
  startDate?: Date,
  endDate?: Date
): boolean => {
  const norm = normalizeExpenseDateStr(dateStr);
  if (!norm || !startDate || !endDate) return false;
  const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
  const nextDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + 1);
  const exclusiveEndStr = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, '0')}-${String(nextDay.getDate()).padStart(2, '0')}`;
  return norm >= startStr && norm < exclusiveEndStr;
};
