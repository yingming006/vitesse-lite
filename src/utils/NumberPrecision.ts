/**
 * @desc Solve the precision problem in floating-point operations, avoiding multiple digits and precision loss after the decimal point.
 *
 * Example problem: 2.3 + 2.4 = 4.699999999999999, 1.0 - 0.9 = 0.09999999999999998
 */

/**
 * Round the given number or string to the specified number of significant digits.
 *
 * @param num The input number or string
 * @param precision An integer specifying the number of significant digits
 *
 * @example round(0.09999999999999998) === 0.1 // true
 * @example round("0.09999999999999998") === 0.1 // true
 */
function round(num: number | string, precision = 15): number {
  const parsedNum = typeof num === 'string' ? Number.parseFloat(num) : num
  return +Number.parseFloat(parsedNum.toPrecision(precision))
}

/**
 * Get the number of digits of a number or string.
 *
 * @param num The input number or string
 */
function getDigitLength(num: number | string): number {
  const parsedNum = typeof num === 'string' ? Number.parseFloat(num) : num
  const eSplit = parsedNum.toString().split(/[eE]/)
  const len = (eSplit[0].split('.')[1] || '').length - +(eSplit[1] || 0)
  return len > 0 ? len : 0
}

/**
 * Convert a number or string to an integer, supporting scientific notation.
 * The number will be scaled up if it is a decimal.
 *
 * @param num The input number or string
 */
function toInteger(num: number | string): number {
  const parsedNum = typeof num === 'string' ? Number.parseFloat(num) : num
  const digitLength = getDigitLength(parsedNum)
  return digitLength > 0 ? round(parsedNum * 10 ** digitLength) : parsedNum
}

/**
 * Check if a number is within the safe integer range.
 *
 * @param num The input number
 * @throws {RangeError} If the number is out of the safe integer range
 */
function checkRange(num: number): void {
  if (num > Number.MAX_SAFE_INTEGER || num < Number.MIN_SAFE_INTEGER)
    throw new RangeError(`${num} is beyond the safe integer range, and the result may not be accurate.`)
}

/**
 * Create an operation function that supports rest parameters.
 *
 * @param operation The original operation function
 */
function createOperationFunction(operation: (a: number, b: number) => number) {
  return (...nums: number[]): number => {
    const [first, ...others] = nums
    return others.reduce((prev, next) => operation(prev, next), first)
  }
}

/**
 * Accurate multiplication.
 *
 * @param nums The numbers to multiply
 */
const multiply = createOperationFunction((a, b) => {
  const aInt = toInteger(a)
  const bInt = toInteger(b)
  const digitLength = getDigitLength(a) + getDigitLength(b)
  const result = aInt * bInt

  checkRange(result)

  return result / 10 ** digitLength
})

/**
 * Accurate addition.
 *
 * @param nums The numbers to add
 */
const add = createOperationFunction((a, b) => {
  const maxDigitLength = Math.max(getDigitLength(a), getDigitLength(b))
  const baseNum = 10 ** maxDigitLength
  return (multiply(a, baseNum) + multiply(b, baseNum)) / baseNum
})

/**
 * Accurate subtraction.
 *
 * @param nums The numbers to subtract
 */
const subtract = createOperationFunction((a, b) => {
  const maxDigitLength = Math.max(getDigitLength(a), getDigitLength(b))
  const baseNum = 10 ** maxDigitLength
  return (multiply(a, baseNum) - multiply(b, baseNum)) / baseNum
})

/**
 * Accurate division.
 *
 * @param nums The numbers to divide
 */
const divide = createOperationFunction((a, b) => {
  const aInt = toInteger(a)
  const bInt = toInteger(b)

  checkRange(aInt)
  checkRange(bInt)

  return multiply(aInt / bInt, round(10 ** (getDigitLength(b) - getDigitLength(a))))
})

/**
 * Accurate rounding function.
 *
 * @param num The number or string to round
 * @param decimal An integer specifying the decimal digits
 */
function roundWithDecimal(num: number | string, decimal: number): number {
  const parsedNum = typeof num === 'string' ? Number.parseFloat(num) : num
  const base = 10 ** decimal
  let result = divide(Math.round(Math.abs(multiply(parsedNum, base))), base)

  if (parsedNum < 0 && result !== 0)
    result = multiply(result, -1)

  return result
}

// Test cases
// console.log(add(2.3, 2.4) === 4.7) // true
// console.log(subtract(1.0, 0.9) === 0.1) // true
// console.log(multiply(3.3, 4.4) === 14.52) // true
// console.log(divide(10, 3) === 3.3333333333333335) // true
// console.log(roundWithDecimal(1.235, 2) === 1.24) // true

export { round, add, subtract, multiply, divide, roundWithDecimal }
