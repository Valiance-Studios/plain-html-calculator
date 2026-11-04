import {OPERATORS, type Operation} from './operators';
import {
  SCIENTIFIC_CONSTANTS,
  SCIENTIFIC_FUNCTIONS,
  type AngleUnit,
  type ScientificConstant,
  type ScientificFunction,
} from './scientificFunctions';

/** An operand waiting on its right-hand side, e.g. "2 +" while "3 × 4" is entered. */
interface PendingOperation {
  operand: string
  operation: Operation
}

const OPEN_PAREN = '(';

export class Calculator {
  private currentOperand: string = '0';
  // Between parentheses, precedence increases towards the end
  private pending: (PendingOperation | typeof OPEN_PAREN)[] = [];
  private shouldResetScreen: boolean = false;
  private isEvaluated: boolean = false; // Tracks if a result was just produced
  private lastOperation: Operation | null = null;
  private lastOperand: string | null = null;
  private isOperandComputed: boolean = false; // The current operand was produced, not typed digits
  private angleUnit: AngleUnit = 'deg';

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
    this.isOperandComputed = false;
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
      this.isOperandComputed = false;
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
    if (this.innermostOperation() && !this.hasSecondOperand()) {
      this.pending.pop();
    }

    // Anything that binds at least as tightly can be resolved now: "2 + 3 × 4 +"
    // collapses to "14 +", while "2 + 3 ×" has to wait for its right-hand side.
    const {precedence, isRightAssociative} = OPERATORS[operation];
    if (!this.reducePending(isRightAssociative ? precedence + 1 : precedence)) return;

    this.pending.push({operand: this.currentOperand, operation});
    this.lastOperation = null;
    this.lastOperand = null;
    this.shouldResetScreen = true;
    this.isEvaluated = false;
    this.isOperandComputed = false;
  }

  public compute(): void {
    if (this.currentOperand === 'Error') return;

    // Parentheses left open around the current operand have nothing more to group
    while (this.pending.at(-1) === OPEN_PAREN) {
      this.pending.pop();
    }

    const innermost = this.innermostOperation();

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

    // Each pass resolves up to the next open parenthesis, which is then discarded
    while (this.pending.length > 0) {
      if (!this.reducePending(0)) return;
      this.pending.pop();
    }

    this.shouldResetScreen = true;
    this.isEvaluated = true;
    this.isOperandComputed = false;
  }

  /**
   * Starts a group. A value already entered multiplies it, as in 2(3 + 4).
   */
  public openParenthesis(): void {
    if (this.currentOperand === 'Error') {
      this.clear();
    }

    const isValueEntered = this.isOperandComputed || (!this.shouldResetScreen && this.currentOperand !== '0');

    if (isValueEntered) {
      this.chooseOperation('*');
      if (this.currentOperand === 'Error') return;
    }

    this.pending.push(OPEN_PAREN);
    this.currentOperand = '0';
    this.lastOperation = null;
    this.lastOperand = null;
    this.shouldResetScreen = true;
    this.isEvaluated = false;
    this.isOperandComputed = false;
  }

  /**
   * Resolves the innermost group into the current operand, if a group is open.
   */
  public closeParenthesis(): void {
    if (this.currentOperand === 'Error' || !this.pending.includes(OPEN_PAREN)) return;
    if (!this.reducePending(0)) return;

    this.pending.pop();
    this.setComputedOperand(this.currentOperand);
  }

  /**
   * Applies a function to the current number straight away, like '%' and '+/-'.
   */
  public applyFunction(scientificFunction: ScientificFunction): void {
    if (this.currentOperand === 'Error') return;

    const result = SCIENTIFIC_FUNCTIONS[scientificFunction](parseFloat(this.currentOperand), this.angleUnit);

    if (!Number.isFinite(result)) {
      this.enterErrorState();
      return;
    }

    this.setComputedOperand(this.formatResult(result));
  }

  /**
   * Replaces the current number with a constant, at its full precision.
   */
  public enterConstant(constant: ScientificConstant): void {
    if (this.currentOperand === 'Error') {
      this.clear();
    }

    this.setComputedOperand(String(SCIENTIFIC_CONSTANTS[constant]));
  }

  public toggleAngleUnit(): void {
    this.angleUnit = this.angleUnit === 'deg' ? 'rad' : 'deg';
  }

  public getAngleUnit(): AngleUnit {
    return this.angleUnit;
  }

  /**
   * Converts the current number from a percentage. After + or - it is taken as a
   * percentage of the operand before it (200 + 10% adds 20); otherwise it is simply
   * divided by 100 (50% is 0.5, and 200 x 10% multiplies by 0.1).
   */
  public percent(): void {
    if (this.currentOperand === 'Error') return;

    const fraction = parseFloat(this.currentOperand) / 100;
    const innermost = this.innermostOperation();
    const isRelative = innermost?.operation === '+' || innermost?.operation === '-';
    const result = isRelative ? parseFloat(innermost.operand) * fraction : fraction;

    this.setComputedOperand(this.formatResult(result));
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
    // State 1: Operations are pending (e.g., "2 + 3 ×" or "2 × (3 + 4")
    if (this.pending.length > 0) {
      const parts = this.pending.map((entry) => {
        return entry === OPEN_PAREN ? entry : `${entry.operand} ${OPERATORS[entry.operation].symbol}`;
      });

      if (this.hasSecondOperand()) {
        parts.push(this.currentOperand);
      }

      return parts.join(' ').replaceAll(`${OPEN_PAREN} `, OPEN_PAREN);
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
    return !this.shouldResetScreen || this.isOperandComputed;
  }

  /**
   * The operation awaiting the current operand, unless a parenthesis has just opened.
   */
  private innermostOperation(): PendingOperation | null {
    const innermost = this.pending.at(-1);
    return innermost && innermost !== OPEN_PAREN ? innermost : null;
  }

  /**
   * Holds a finished value as the operand. Typing replaces it, but operators build on it.
   */
  private setComputedOperand(value: string): void {
    this.currentOperand = value;
    this.shouldResetScreen = true;
    this.isOperandComputed = true;

    if (this.pending.length === 0) {
      this.isEvaluated = true;
    }
  }

  /**
   * Resolves pending operations, innermost first, into the current operand for as
   * long as they bind at least as tightly as minPrecedence, stopping at any open
   * parenthesis. Returns false if one had no valid result, leaving the calculator
   * in its Error state.
   */
  private reducePending(minPrecedence: number): boolean {
    let innermost = this.innermostOperation();

    while (innermost && OPERATORS[innermost.operation].precedence >= minPrecedence) {
      const result = OPERATORS[innermost.operation].apply(
        parseFloat(innermost.operand),
        parseFloat(this.currentOperand),
      );

      // Dividing by zero, for example, gives Infinity or NaN rather than throwing
      if (!Number.isFinite(result)) {
        this.enterErrorState();
        return false;
      }

      this.currentOperand = this.formatResult(result);
      this.pending.pop();
      innermost = this.innermostOperation();
    }

    return true;
  }

  private enterErrorState(): void {
    this.clear();
    this.currentOperand = 'Error';
  }

  /**
   * Fixes floating point issues (e.g., 0.1 + 0.2 = 0.30000000000000004 -> 0.3).
   */
  private formatResult(value: number): string {
    // Scaling a value this large up by 1e12 could overflow, and it has no fraction to tidy
    if (Math.abs(value) >= 1e15) return String(value);

    const rounded = Math.round((value + Number.EPSILON) * 1e12) / 1e12;

    // Very small values like 10 ^ -13 are real results, not noise to round away
    return String(rounded === 0 && value !== 0 ? Number(value.toPrecision(12)) : rounded);
  }
}
