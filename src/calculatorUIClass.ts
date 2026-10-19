import {Calculator, type Operation} from './calculatorClass';

export class CalculatorUI {
  private calculator: Calculator;
  private primaryDisplay: HTMLElement;
  private secondaryDisplay: HTMLElement;

  constructor(calculator: Calculator) {
    this.calculator = calculator;
    this.primaryDisplay = document.getElementById('display-primary')!;
    this.secondaryDisplay = document.getElementById('display-secondary')!;

    if (!this.primaryDisplay) {
      throw new Error('Cannot initialize CalculatorUI: "#display-primary" query returned null.');
    }

    if (!this.secondaryDisplay) {
      throw new Error('Cannot initialize CalculatorUI: "#display-secondary" query returned null.');
    }

    this.initEventListeners();
    this.updateDisplay();
  }

  private initEventListeners(): void {
    const keysWrapper = document.querySelector('.calculator-keys-wrapper');
    if (!keysWrapper) {
      throw new Error('Cannot initialize event listeners: ".calculator-keys-wrapper" query returned null.');
    }

    keysWrapper.addEventListener('click', (event: Event) => {
      const target = (event.target as HTMLElement).closest('button');
      if (!target) return;
      this.handleInput(target.dataset.type, target.value);
    });

    window.addEventListener('keydown', (event: KeyboardEvent) => {
      const mappedInput = this.mapKeyboardToInput(event);
      if (mappedInput) {
        event.preventDefault();
        this.handleInput(mappedInput.type, mappedInput.value);
      }
    });
  }

  /**
   * Centralized dispatcher for all inputs, whether from click or keyboard events.
   */
  private handleInput(type: string | undefined, value: string): void {
    switch (type) {
      case 'number': {
        this.calculator.appendNumber(value);
        break;
      }

      case 'operator': {
        this.calculator.chooseOperation(value as Operation);
        break;
      }

      case 'action': {
        if (value === 'clear' || value === 'all-clear') {
          this.calculator.clear();
        } else if (value === 'delete' || value === 'single-delete') {
          this.calculator.delete();
        } else if (value === 'calculate' || value === '=') {
          this.calculator.compute();
        } else if (value === 'invert-sign') {
          this.calculator.invertSign();
        }
        break;
      }
    }

    this.updateDisplay();
  }

  /**
   * Maps raw keyboard events into normalized input types and values.
   */
  private mapKeyboardToInput(event: KeyboardEvent): {type: string, value: string} | null {
    const key = event.key;

    if (/^[0-9.]$/.test(key)) {
      return {type: 'number', value: key};
    }

    if (['+', '-', '*', '/'].includes(key)) {
      return {type: 'operator', value: key};
    }

    if (key === 'Enter' || key === '=') {
      return {type: 'action', value: 'calculate'};
    }

    if (key === 'Backspace') {
      return {type: 'action', value: 'delete'};
    }

    if (key === 'Escape') {
      return {type: 'action', value: 'clear'};
    }

    return null;
  }

  private updateDisplay(): void {
    this.primaryDisplay.textContent = this.calculator.getDisplayValue();
    this.secondaryDisplay.textContent = this.calculator.getExpressionValue();
  }
}
