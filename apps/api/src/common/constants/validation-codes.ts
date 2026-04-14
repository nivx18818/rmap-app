/**
 * Validation constraint codes for class-validator
 * These map to specific validation failures
 */
export const ValidationConstraintCodes: Record<string, string> = {
  isAlpha: 'STRING_TYPE_ALPHA',
  isAlphanumeric: 'STRING_TYPE_ALPHANUMERIC',
  isArray: 'ARRAY_TYPE_EXPECTED',
  isBoolean: 'BOOLEAN_TYPE_EXPECTED',
  isDate: 'DATE_TYPE_EXPECTED',
  isDateString: 'DATE_STRING_INVALID',
  isDecimal: 'DECIMAL_TYPE_EXPECTED',
  isEmail: 'EMAIL_FORMAT_INVALID',
  isEmpty: 'VALUE_SHOULD_BE_EMPTY',
  isEnum: 'ENUM_VALUE_INVALID',
  isInt: 'INTEGER_TYPE_EXPECTED',
  isNotEmpty: 'VALUE_REQUIRED',
  isNumber: 'NUMBER_TYPE_EXPECTED',
  isObject: 'OBJECT_TYPE_EXPECTED',
  isOptional: 'VALUE_OPTIONAL',
  isString: 'STRING_TYPE_EXPECTED',
  isUrl: 'URL_FORMAT_INVALID',
  isUUID: 'UUID_FORMAT_INVALID',
  max: 'NUMBER_TOO_LARGE',
  maxLength: 'STRING_TYPE_MAX_LENGTH',
  min: 'NUMBER_TOO_SMALL',
  minLength: 'STRING_TYPE_MIN_LENGTH',
  whitelistValidation: 'PROPERTY_NOT_ALLOWED',
};

export function getValidationCode(constraintKey: string): string {
  return ValidationConstraintCodes[constraintKey] || 'VALIDATION_CONSTRAINT_FAILED';
}
