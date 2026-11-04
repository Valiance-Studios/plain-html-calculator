import {Calculator} from '../src/calculatorClass';
import {CalculatorUI} from '../src/calculatorUIClass';

describe('CalculatorUI Integration', () => {
  beforeEach(() => {
    // Set up minimal HTML fixture in the simulated DOM.
    document.body.innerHTML = `
      <div class="calculator-wrapper">
        <div class="calculator-display">
          <div id="display-secondary" data-testid="display-secondary"></div>
          <div id="display-primary" data-testid="display-primary">0</div>
        </div>
        <div class="calculator-keys-wrapper">
          <button data-testid="btn-7" data-type="number" value="7">7</button>
          <button data-testid="btn-plus" data-type="operator" value="+">+</button>
          <button data-testid="btn-3" data-type="number" value="3">3</button>
          <button data-testid="btn-equals" data-type="action" value="calculate">=</button>
        </div>
      </div>
    `;

    const calc = new Calculator();
    new CalculatorUI(calc);
  });

  it('should update the DOM displays when buttons are clicked', () => {
    const btn7 = document.querySelector('[data-testid="btn-7"]') as HTMLButtonElement;
    const btnPlus = document.querySelector('[data-testid="btn-plus"]') as HTMLButtonElement;
    const btn3 = document.querySelector('[data-testid="btn-3"]') as HTMLButtonElement;
    const btnEquals = document.querySelector('[data-testid="btn-equals"]') as HTMLButtonElement;

    const primaryDisplay = document.querySelector('[data-testid="display-primary"]');
    const secondaryDisplay = document.querySelector('[data-testid="display-secondary"]');

    btn7.click();
    expect(primaryDisplay?.textContent).toBe('7');

    btnPlus.click();
    expect(secondaryDisplay?.textContent).toBe('7 +');

    btn3.click();
    expect(primaryDisplay?.textContent).toBe('3');

    btnEquals.click();
    expect(primaryDisplay?.textContent).toBe('10');
  });

  it('should respond to physical keyboard events', () => {
    const primaryDisplay = document.querySelector('[data-testid="display-primary"]');

    window.dispatchEvent(new KeyboardEvent('keydown', {key: '5'}));
    expect(primaryDisplay?.textContent).toBe('5');
  });

  it('should apply percent from the keyboard', () => {
    const primaryDisplay = document.querySelector('[data-testid="display-primary"]');

    window.dispatchEvent(new KeyboardEvent('keydown', {key: '5'}));
    window.dispatchEvent(new KeyboardEvent('keydown', {key: '%'}));
    expect(primaryDisplay?.textContent).toBe('0.05');
  });

  it('should publish each display\'s text length so the stylesheet can scale it to fit', () => {
    const primaryDisplay = document.querySelector('[data-testid="display-primary"]') as HTMLElement;
    const secondaryDisplay = document.querySelector('[data-testid="display-secondary"]') as HTMLElement;
    const btn7 = document.querySelector('[data-testid="btn-7"]') as HTMLButtonElement;
    const btnPlus = document.querySelector('[data-testid="btn-plus"]') as HTMLButtonElement;

    btn7.click();
    btn7.click();
    btn7.click();
    expect(primaryDisplay.style.getPropertyValue('--display-length')).toBe('3');

    btnPlus.click();
    expect(secondaryDisplay.style.getPropertyValue('--display-length')).toBe('5');
  });

  it('should never publish a zero length, which would divide by zero in the stylesheet', () => {
    const secondaryDisplay = document.querySelector('[data-testid="display-secondary"]') as HTMLElement;
    const buttons = ['btn-7', 'btn-plus', 'btn-3', 'btn-equals'];

    buttons.forEach((testId) => {
      (document.querySelector(`[data-testid="${testId}"]`) as HTMLButtonElement).click();
    });

    expect(secondaryDisplay.textContent).toBe('');
    expect(secondaryDisplay.style.getPropertyValue('--display-length')).toBe('1');
  });
});
