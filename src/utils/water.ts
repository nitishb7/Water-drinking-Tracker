// Simple recommended water intake formula
// Default: 35 ml per kg body weight for adults
// You can tweak if needed; we keep it minimal
export function recommendedMl(age: number, weightKg: number) {
  const base = 35 // ml per kg
  // light adjustment by age range
  const factor = age < 14 ? 40 : age > 55 ? 30 : base
  const ml = Math.round(weightKg * factor)
  // clamp to a reasonable range
  return Math.min(Math.max(ml, 1200), 4500)
}

