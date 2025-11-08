export function isIntegerOrInfinity(str: string): boolean {
  const pattern = /^-?\d+$|^∞$/
  return pattern.test(str)
}

export function stringToNumber(str: string): number {
  // 如果是 ∞，返回 Infinity
  if (str === '∞') return Infinity

  // 尝试转换为数字
  const num = Number(str)

  // 检查是否为有效整数
  if (!isNaN(num) && Number.isInteger(num)) {
    return num
  }

  return Infinity
}
