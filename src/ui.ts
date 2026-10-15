import {wrapError} from '@lib/error';
import {evaluateCurrentExpression, getCurrentExpression, setCurrentExpression} from './engine';

function getCalculatorScreen(): HTMLInputElement {
  const screen = document.querySelector('.calculator-screen') as HTMLInputElement;
  if (screen) {
    return screen;
  }

  throw wrapError(new Error('Element query ".calculator-screen" returned null'), 'Could not get calculator screen.');
}

const NUMBER_KEYS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;
const OPERATOR_KEYS = ['+', '-', '*', '/'] as const;
const CONTROL_KEYS = ['C', 'Backspace', 'Enter'] as const;

let CLEAR_ON_NEXT_BACKSPACE = false;

function updateCalculatorScreen() {
  const screen = getCalculatorScreen();
  screen.value = getCurrentExpression();
}

function initCalculatorEvents() {
  document.addEventListener('keydown', (event) => {
    console.log(event.key);

    const currentExpression = getCurrentExpression();

    if (NUMBER_KEYS.includes(event.key as typeof NUMBER_KEYS[number])) {
      setCurrentExpression(currentExpression + event.key);
      updateCalculatorScreen();
    } else if (OPERATOR_KEYS.includes(event.key as typeof OPERATOR_KEYS[number])) {
      setCurrentExpression(currentExpression + event.key);
      updateCalculatorScreen();
    } else if (CONTROL_KEYS.includes(event.key as typeof CONTROL_KEYS[number])) {
      switch (event.key) {
        case 'C':
          setCurrentExpression('');
          updateCalculatorScreen();
          break;
        case 'Backspace':
          if (CLEAR_ON_NEXT_BACKSPACE) {
            setCurrentExpression('');
            CLEAR_ON_NEXT_BACKSPACE = false;
          } else {
            setCurrentExpression(currentExpression.slice(0, -1));
          }
          updateCalculatorScreen();
          break;
        case 'Enter':
          setCurrentExpression(evaluateCurrentExpression());
          updateCalculatorScreen();
          // My preferred behavior is we clear the screen if we backspace after having just evaluated an expression.
          CLEAR_ON_NEXT_BACKSPACE = true;
          break;
      }
    }
  });
}

export {
  initCalculatorEvents,
};
