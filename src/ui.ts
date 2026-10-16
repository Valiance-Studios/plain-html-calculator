import {wrapError} from '@lib/error';
import {Calculator, type Operation} from './calculatorClass';

const calculator = new Calculator();

function isKeyOperator(key: string | null): key is Operation {
  if (key === null) return false;

  return ['+', '-', '*', '/'].includes(key);
}

function updateCalculatorScreen(): void {
  const primaryDisplay = document.getElementById('display-primary');
  if (!primaryDisplay) {
    throw wrapError(new Error('Query "display-primary" returned null.'), 'Could not find the primary display element');
  }

  const secondaryDisplay = document.getElementById('display-secondary');
  if (!secondaryDisplay) {
    throw wrapError(new Error('Query "display-secondary" returned null.'), 'Could not find the secondary display element');
  }

  primaryDisplay.textContent = calculator.getDisplayValue();
  secondaryDisplay.textContent = calculator.getExpressionValue();
}

function handleKeyboardEvent(event: KeyboardEvent): void {
  const key = event.key;

  // Numbers 0-9 and decimal point
  if (/^[0-9.]$/.test(key)) {
    calculator.appendNumber(key);
    updateCalculatorScreen();
    return;
  }

  // Operators
  if (isKeyOperator(key)) {
    calculator.chooseOperation(key);
    updateCalculatorScreen();
    return;
  }

  // Action keys
  if (key === 'Enter' || key === '=') {
    // Prevents triggering focused UI buttons twice
    event.preventDefault();
    calculator.compute();
    updateCalculatorScreen();
    return;
  }

  if (key === 'Backspace') {
    calculator.delete();
    updateCalculatorScreen();
    return;
  }

  if (key === 'Escape') {
    calculator.clear();
    updateCalculatorScreen();
    return;
  }
}

function initKeyboardEvents() {
  window.addEventListener('keydown', (event: KeyboardEvent) => handleKeyboardEvent(event));
}

function initButtonEvents() {
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach((button) => {
    button.addEventListener('click', (event) => {
      console.log('event:', event);
    });
  });
}

export {
  initKeyboardEvents,
  initButtonEvents,
};
