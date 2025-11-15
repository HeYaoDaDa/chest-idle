import { INFINITE_AMOUNT } from './constants'

export function isInfiniteAmount(amount: number): boolean {
  return amount === INFINITE_AMOUNT
}

export function toFiniteForCompute(amount: number): number {
  return isInfiniteAmount(amount) ? Infinity : amount
}

export function fromComputeResult(value: number): number {
  return value === Infinity ? INFINITE_AMOUNT : value
}

export function decrementAmount(amount: number, delta: number): number {
  if (isInfiniteAmount(amount)) return amount
  return Math.max(0, amount - delta)
}
