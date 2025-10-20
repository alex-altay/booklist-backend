import { ValidatorConstraint } from 'class-validator'
import type { ValidatorConstraintInterface, ValidationArguments } from 'class-validator'

const MIN_TIMESTAMP = 0 // 1970
const MAX_TIMESTAMP = 4102444800000 // 2100

@ValidatorConstraint({ name: 'isValidDate', async: false })
class IsValidDateConstraint implements ValidatorConstraintInterface {
  validate(value: unknown) {
    if (value === null || value === undefined) {
      return true
    } else if (value instanceof Date) {
      const timestamp = value.getTime()
      return !Number.isNaN(timestamp) && timestamp >= MIN_TIMESTAMP && timestamp < MAX_TIMESTAMP
    }
    return false
  }
  defaultMessage(_: ValidationArguments) {
    return 'must be a valid date, ISO string or timestamp, or null'
  }
}

function transformDate({ value }): Date | null | undefined {
  if (value === null || value === undefined) {
    return value as null | undefined
  } else if (typeof value === 'number' || /^[0-9]+$/.test(String(value))) {
    return new Date(+value)
  } else if (typeof value === 'string') {
    return new Date(value)
  }
  return value as Date
}

const swaggerDateDescription = {
  schema: {
    oneOf: [
      { type: 'string', format: 'date-time', example: '2024-10-20T10:30:00Z' },
      { type: 'integer', example: 1729420200000, description: 'Unix timestamp (ms)' },
    ],
    nullable: true,
  },
  required: false,
  description: 'Accepts ISO 8601 date string or Unix timestamp in milliseconds',
}

export { transformDate, IsValidDateConstraint, swaggerDateDescription }
