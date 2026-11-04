export type Operation = '+' | '-' | '*' | '/';

interface OperatorDefinition {
  symbol: string
  /** Higher binds tighter: × is evaluated before + regardless of entry order. */
  precedence: number
  apply: (left: number, right: number) => number
}

export const OPERATORS: Record<Operation, OperatorDefinition> = {
  '+': {symbol: '+', precedence: 1, apply: (left, right) => left + right},
  '-': {symbol: '-', precedence: 1, apply: (left, right) => left - right},
  '*': {symbol: '×', precedence: 2, apply: (left, right) => left * right},
  '/': {symbol: '÷', precedence: 2, apply: (left, right) => left / right},
};
