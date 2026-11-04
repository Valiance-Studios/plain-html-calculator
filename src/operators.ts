export type Operation = '+' | '-' | '*' | '/' | 'mod' | '^';

interface OperatorDefinition {
  symbol: string
  /** Higher binds tighter: × is evaluated before + regardless of entry order. */
  precedence: number
  /** Whether a chain groups from the right, as in 2 ^ 3 ^ 2 = 2 ^ 9. */
  isRightAssociative?: boolean
  apply: (left: number, right: number) => number
}

export const OPERATORS: Record<Operation, OperatorDefinition> = {
  '+': {symbol: '+', precedence: 1, apply: (left, right) => left + right},
  '-': {symbol: '-', precedence: 1, apply: (left, right) => left - right},
  '*': {symbol: '×', precedence: 2, apply: (left, right) => left * right},
  '/': {symbol: '÷', precedence: 2, apply: (left, right) => left / right},
  'mod': {symbol: 'mod', precedence: 2, apply: (left, right) => left % right},
  '^': {symbol: '^', precedence: 3, isRightAssociative: true, apply: (left, right) => left ** right},
};
