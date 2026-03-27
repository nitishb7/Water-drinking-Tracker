import type { VolumeUnit } from '../types'

export const VOLUME_UNITS: VolumeUnit[] = ['ml', 'l', 'fl oz']

const ML_PER_FL_OZ = 29.5735

export function convertFromMl(valueMl: number, unit: VolumeUnit) {
  if (unit === 'l') return valueMl / 1000
  if (unit === 'fl oz') return valueMl / ML_PER_FL_OZ
  return valueMl
}

export function convertToMl(value: number, unit: VolumeUnit) {
  if (unit === 'l') return value * 1000
  if (unit === 'fl oz') return value * ML_PER_FL_OZ
  return value
}

export function getUnitLabel(unit: VolumeUnit) {
  if (unit === 'l') return 'L'
  return unit
}

export function getInputStep(unit: VolumeUnit) {
  if (unit === 'l') return 0.1
  if (unit === 'fl oz') return 1
  return 50
}

export function getInputMin(unit: VolumeUnit) {
  const minMl = 50
  if (unit === 'l') return 0.1
  if (unit === 'fl oz') return Math.max(1, Math.round(convertFromMl(minMl, unit)))
  return minMl
}

export function formatVolume(
  valueMl: number,
  unit: VolumeUnit,
  options?: { compact?: boolean; maximumFractionDigits?: number },
) {
  const compact = options?.compact ?? false
  const maximumFractionDigits =
    options?.maximumFractionDigits ?? (unit === 'ml' ? 0 : unit === 'l' ? 2 : 1)
  const value = convertFromMl(valueMl, unit)
  const formatted = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: compact ? 0 : unit === 'ml' ? 0 : 1,
    maximumFractionDigits,
  }).format(value)
  return `${formatted} ${getUnitLabel(unit)}`
}

export function formatInputValue(valueMl: number, unit: VolumeUnit) {
  const value = convertFromMl(valueMl, unit)
  if (unit === 'ml') return String(Math.round(value))
  return value.toFixed(unit === 'l' ? 1 : 0)
}
