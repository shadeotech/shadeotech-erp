export interface ProductionSheetRow {
  ser: number
  qty: number
  seq: string
  area: string
  width: number
  height: number
  cord: number
  pos: string
  shades: number
  fascia: number
  tube: number
  bottomRail: number
  bottomTub: number
  fabricWidth: number
  fabricHeight: number
}

const FRACTION_MAP: Record<number, string> = {
  1: '1/16', 2: '1/8', 3: '3/16', 4: '1/4', 5: '5/16', 6: '3/8',
  7: '7/16', 8: '1/2', 9: '9/16', 10: '5/8', 11: '11/16', 12: '3/4',
  13: '13/16', 14: '7/8', 15: '15/16',
}

export function decimalToFraction(value: number): string {
  if (value === undefined || value === null || isNaN(value)) return ''
  const negative = value < 0
  const abs = Math.abs(value)
  const whole = Math.floor(abs)
  const rem = abs - whole
  const n = Math.round(rem * 16)
  let result: string
  if (n === 0) {
    result = `${whole}`
  } else if (n === 16) {
    result = `${whole + 1}`
  } else {
    result = whole > 0 ? `${whole} ${FRACTION_MAP[n]}` : FRACTION_MAP[n]
  }
  return negative ? `-${result}` : result
}

export function computeTriShadeRow(item: {
  lineNumber: number
  qty: number
  sequence?: string
  area?: string
  width: string
  length: string
  controlSide?: string
}): ProductionSheetRow {
  const w = parseFloat(item.width) || 0
  const h = parseFloat(item.length) || 0
  const tube = w - 1.1875
  return {
    ser: item.lineNumber,
    qty: item.qty,
    seq: item.sequence || '',
    area: item.area || '',
    width: w,
    height: h,
    cord: Math.round(h * (2 / 3) * 16) / 16,
    pos: item.controlSide || '',
    shades: w - 0.125,
    fascia: w - 0.5,
    tube,
    bottomRail: w - 1.125,
    bottomTub: tube - 0.1875,
    fabricWidth: tube,
    fabricHeight: h + 1.5,
  }
}
