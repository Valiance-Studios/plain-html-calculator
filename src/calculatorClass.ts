import {OPERATORS, type Operation} from './operators';

/** An operand waiting on its right-hand side, e.g. "2 +" while "3 × 4" is entered. */
interface PendingOperation {
  operand: string
  operation: Operation
}

export class Calculator {
  private currentOperand: string = '0';
  private pending: PendingOperation[] = []; // Precedence increases towards the end
  private shouldResetScreen: boolean = false;
  private isEvaluated: boolean = false; // Tracks if a result was just produced
  private lastOperation: Operation | null = null;
  private lastOperand: string | null = null;
  private isPercentApplied: boolean = false; // The current operand came from '%', not typed digits

  constructor() {
    this.clear();
  }

  public clear(): void {
    this.currentOperand = '0';
    this.pending = [];
    this.lastOperation = null;
    this.lastOperand = null;
    this.shouldResetScreen = false;
    this.isEvaluated = false;
    this.isPercentApplied = false;
  }

  public delete(): void {
    if (this.shouldResetScreen) return;

    // A lone digit, with or without its sign, has nothing left once removed
    if (/^-?.$/.test(this.currentOperand) || this.currentOperand === 'Error') {
      this.currentOperand = '0';
      return;
    }

    this.currentOperand = this.currentOperand.slice(0, -1);
  }

  public appendNumber(numberString: string): void {
    if (this.currentOperand === 'Error' || this.shouldResetScreen) {
      this.currentOperand = '0';
      this.shouldResetScreen = false;
      this.isPercentApplied = false;
    }

    // Prevent multiple decimals
    if (numberString === '.' && this.currentOperand.includes('.')) return;

    if (this.currentOperand === '0' && numberString !== '.') {
      // Multi-digit keys like '00' must not leave leading zeros behind
      this.currentOperand = numberString.replace(/^0+(?=\d)/, '');
    } else {
      this.currentOperand += numberString;
    }
  }

  public chooseOperation(operation: Operation): void {
    if (this.currentOperand === 'Error') return;

    // Pressing a second operator in a row replaces the first (e.g., 2 + 3 × +)
    if (this.pending.length > 0 && !this.hasSecondOperand()) {
      this.pending.pop();
    }

    // Anything that binds at least as tightly can be resolved now: "2 + 3 × 4 +"
    // collapses to "14 +", while "2 + 3 ×" has to wait for its right-hand side.
    if (!this.reducePending(OPERATORS[operation].precedence)) return;

    this.pending.push({operand: this.currentOperand, operation});
    this.lastOperation = null;
    this.lastOperand = null;
    this.shouldResetScreen = true;
    this.isEvaluated = false;
    this.isPercentApplied = false;
  }

  public compute(): void {
    if (this.currentOperand === 'Error') return;

    const innermost = this.pending.at(-1);

    if (innermost) {
      this.lastOperation = innermost.operation;
      this.lastOperand = this.currentOperand;
    } else if (this.lastOperation !== null && this.lastOperand !== null) {
      // Pressing '=' again repeats the last operation (e.g., 9 + 3 = = gives 15)
      this.pending.push({operand: this.currentOperand, operation: this.lastOperation});
      this.currentOperand = this.lastOperand;
    } else {
      return;
    }

    if (!this.reducePending(0)) return;

    this.shouldResetScreen = true;
    this.isEvaluated = true;
    this.isPercentApplied = false;
  }

  /**
   * Converts the current number from a percentage. After + or - it is taken as a
   * percentage of the operand before it (200 + 10% adds 20); otherwise it is simply
   * divided by 100 (50% is 0.5, and 200 x 10% multiplies by 0.1).
   */
  public percent(): void {
    if (this.currentOperand === 'Error') return;

    const fraction = parseFloat(this.currentOperand) / 100;
    const innermost = this.pending.at(-1);

    if (!innermost) {
      this.currentOperand = this.formatResult(fraction);
      this.isEvaluated = true;
    } else {
      const isRelative = innermost.operation === '+' || innermost.operation === '-';
      const result = isRelative ? parseFloat(innermost.operand) * fraction : fraction;
      this.currentOperand = this.formatResult(result);
      this.isPercentApplied = true;
    }

    this.shouldResetScreen = true;
  }

  public invertSign(): void {
    if (this.currentOperand === 'Error' || this.currentOperand === '0') return;

    if (this.currentOperand.startsWith('-')) {
      this.currentOperand = this.currentOperand.slice(1);
    } else {
      this.currentOperand = `-${this.currentOperand}`;
    }
  }

  /**
   * Returns the number currently being entered or the calculation result.
   */
  public getDisplayValue(): string {
    return this.currentOperand;
  }

  /**
   * Returns the full formula currently being built.
   */
  public getExpressionValue(): string {
    // State 1: Operations are pending (e.g., "2 + 3 ×" or "2 + 3 × 4")
    if (this.pending.length > 0) {
      const expression = this.pending
        .map(({operand, operation}) => `${operand} ${OPERATORS[operation].symbol}`)
        .join(' ');

      return this.hasSecondOperand() ? `${expression} ${this.currentOperand}` : expression;
    }

    // State 2: Just calculated a result (e.g., show nothing or last result context)
    if (this.isEvaluated) {
      return '';
    }

    // State 3: Entry of the very first number (e.g., "1234")
    return this.currentOperand;
  }

  /**
   * Whether the current operand is the right-hand side of the innermost pending
   * operation, rather than a value the user hasn't yet replaced.
   */
  private hasSecondOperand(): boolean {
    return !this.shouldResetScreen || this.isPercentApplied;
  }

  /**
   * Resolves pending operations, innermost first, into the current operand for as
   * long as they bind at least as tightly as minPrecedence. Returns false if one
   * had no valid result, leaving the calculator in its Error state.
   */
  private reducePending(minPrecedence: number): boolean {
    let innermost = this.pending.at(-1);

    while (innermost && OPERATORS[innermost.operation].precedence >= minPrecedence) {
      const result = OPERATORS[innermost.operation].apply(
        parseFloat(innermost.operand),
        parseFloat(this.currentOperand),
      );

      // Dividing by zero, for example, gives Infinity or NaN rather than throwing
      if (!Number.isFinite(result)) {
        this.clear();
        this.currentOperand = 'Error';
        return false;
      }

      this.currentOperand = this.formatResult(result);
      this.pending.pop();
      innermost = this.pending.at(-1);
    }

    return true;
  }

  /**
   * Fixes floating point issues (e.g., 0.1 + 0.2 = 0.30000000000000004 -> 0.3).
   */
  private formatResult(value: number): string {
    return String(Math.round((value + Number.EPSILON) * 1e12) / 1e12);
  }
}
