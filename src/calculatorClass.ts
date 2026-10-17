export type Operation = '+' | '-' | '*' | '/' | null;

export class Calculator {
  private currentOperand: string = '0';
  private previousOperand: string = '';
  private activeOperation: Operation = null;
  private shouldResetScreen: boolean = false;
  private isEvaluated: boolean = false; // Tracks if '=' was just pressed
  private lastOperation: Operation = null;
  private lastOperand: number | null = null;

  constructor() {
    this.clear();
  }

  public clear(): void {
    this.currentOperand = '0';
    this.previousOperand = '';
    this.activeOperation = null;
    this.lastOperation = null;
    this.lastOperand = null;
    this.shouldResetScreen = false;
    this.isEvaluated = false;
  }

  public delete(): void {
    if (this.shouldResetScreen) return;

    if (this.currentOperand.length === 1 || this.currentOperand === 'Error') {
      this.currentOperand = '0';
      return;
    }

    this.currentOperand = this.currentOperand.slice(0, -1);
  }

  public appendNumber(numberString: string): void {
    if (this.currentOperand === 'Error' || this.shouldResetScreen) {
      this.currentOperand = numberString === '.' ? '0.' : numberString;
      this.shouldResetScreen = false;
      return;
    }

    // Prevent multiple decimals
    if (numberString === '.' && this.currentOperand.includes('.')) return;

    if (this.currentOperand === '0' && numberString !== '.') {
      this.currentOperand = numberString;
    } else {
      this.currentOperand += numberString;
    }
  }

  public chooseOperation(operation: Operation): void {
    if (this.currentOperand === 'Error') return;

    // Chain operations if an operation is already queued up (e.g., 5 + 5 +)
    if (this.activeOperation !== null && !this.shouldResetScreen) {
      this.compute();
    }

    this.previousOperand = this.currentOperand;
    this.activeOperation = operation;
    this.lastOperation = null;
    this.lastOperand = null;
    this.shouldResetScreen = true;
    this.isEvaluated = false;
  }

  public compute(): void {
    if (this.currentOperand === 'Error') return;

    let prev = parseFloat(this.previousOperand);
    let current = parseFloat(this.currentOperand);

    if (this.activeOperation !== null) {
      this.lastOperation = this.activeOperation;
      this.lastOperand = current;
    } else if (this.lastOperation !== null && this.lastOperand !== null) {
      prev = current;
      current = this.lastOperand;
      this.activeOperation = this.lastOperation;
    } else {
      return;
    }

    let result: number;
    switch (this.activeOperation) {
      case '+':
        result = prev + current;
        break;
      case '-':
        result = prev - current;
        break;
      case '*':
        result = prev * current;
        break;
      case '/':
        if (current === 0) {
          this.currentOperand = 'Error';
          this.previousOperand = '';
          this.activeOperation = null;
          return;
        }
        result = prev / current;
        break;
      default:
        return;
    }

    // Fix floating point issues (e.g., 0.1 + 0.2 = 0.30000000000000004 -> 0.3)
    this.currentOperand = String(Math.round((result + Number.EPSILON) * 1e12) / 1e12);
    this.previousOperand = '';
    this.activeOperation = null;
    this.shouldResetScreen = true;
    this.isEvaluated = true; // Mark evaluation complete
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
    // State 1: An operation is active (e.g., "1234 +" or "1234 + 4567")
    if (this.activeOperation !== null) {
      const symbol = this.getSymbol(this.activeOperation);

      // If the user started entering the second number, append it to the expression
      if (!this.shouldResetScreen) {
        return `${this.previousOperand} ${symbol} ${this.currentOperand}`;
      }

      // Otherwise, the user just pressed the operator (e.g., "1234 +")
      return `${this.previousOperand} ${symbol}`;
    }

    // State 2: Just calculated a result with '=' (e.g., show nothing or last result context)
    if (this.isEvaluated) {
      return ''; // Or optionally: `${this.lastOperandA} ${symbol} ${this.lastOperandB} =`
    }

    // State 3: Entry of the very first number (e.g., "1234")
    return this.currentOperand;
  }

  private getSymbol(op: Operation): string {
    switch (op) {
      case '*': {
        return '×';
      }
      case '/': {
        return '÷';
      }
      default: {
        return op || '';
      }
    }
  }
}
