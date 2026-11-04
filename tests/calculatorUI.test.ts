import {Calculator} from '../src/calculatorClass';
import {CalculatorUI} from '../src/calculatorUIClass';

describe('CalculatorUI Integration', () => {
  afterEach(() => {
    // Stops this test's CalculatorUI from also responding to the next test's key presses.
    const addListener = vi.mocked(window.addEventListener);
    addListener.mock.calls.forEach(([type, listener]) => window.removeEventListener(type, listener));
    addListener.mockRestore();
  });

  beforeEach(() => {
    vi.spyOn(window, 'addEventListener');

    // Set up minimal HTML fixture in the simulated DOM.
    document.body.innerHTML = `
      <div class="calculator-wrapper">
        <div class="calculator-display">
          <div id="display-secondary" data-testid="display-secondary"></div>
          <div id="display-primary" data-testid="display-primary">0</div>
          <button id="btn-toggle-mode" data-type="action" value="toggle-mode">SCI</button>
        </div>
        <div class="calculator-keys-scientific">
          <button id="btn-toggle-angle" data-type="action" value="toggle-angle">DEG</button>
          <button id="btn-fn-sqrt" data-type="function" value="sqrt">&radic;</button>
          <button id="btn-const-pi" data-type="constant" value="pi">&pi;</button>
          <button id="btn-fn-square" data-type="function" value="square">x<sup>2</sup></button>
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

  describe('Scientific view', () => {
    const pressKey = (key: string, modifiers: KeyboardEventInit = {}): KeyboardEvent => {
      const event = new KeyboardEvent('keydown', {key, cancelable: true, ...modifiers});
      window.dispatchEvent(event);
      return event;
    };

    const primaryText = (): string | null | undefined => document.getElementById('display-primary')?.textContent;

    it('should start in the basic view', () => {
      expect(document.body.dataset.mode).toBe('basic');
      expect(document.getElementById('btn-toggle-mode')?.textContent).toBe('SCI');
    });

    it('should switch views with the toggle button', () => {
      const toggle = document.getElementById('btn-toggle-mode') as HTMLButtonElement;

      toggle.click();
      expect(document.body.dataset.mode).toBe('scientific');
      expect(toggle.textContent).toBe('BASIC');

      toggle.click();
      expect(document.body.dataset.mode).toBe('basic');
      expect(toggle.textContent).toBe('SCI');
    });

    it('should switch views with the M hotkey', () => {
      pressKey('m');
      expect(document.body.dataset.mode).toBe('scientific');

      pressKey('m');
      expect(document.body.dataset.mode).toBe('basic');
    });

    it('should keep the current value when switching views', () => {
      pressKey('5');
      pressKey('m');
      expect(primaryText()).toBe('5');
    });

    it('should apply functions and constants from their keys', () => {
      pressKey('9');
      (document.getElementById('btn-fn-sqrt') as HTMLButtonElement).click();
      expect(primaryText()).toBe('3');

      (document.getElementById('btn-const-pi') as HTMLButtonElement).click();
      expect(primaryText()).toBe(String(Math.PI));
    });

    it('should recognise a click on a label nested inside a key', () => {
      pressKey('3');
      (document.querySelector('#btn-fn-square sup') as HTMLElement).click();
      expect(primaryText()).toBe('9');
    });

    it('should show and switch the angle unit', () => {
      const toggle = document.getElementById('btn-toggle-angle') as HTMLButtonElement;
      expect(toggle.textContent).toBe('DEG');

      toggle.click();
      expect(toggle.textContent).toBe('RAD');

      pressKey('m');
      pressKey('d');
      expect(toggle.textContent).toBe('DEG');
    });

    it('should only respond to scientific hotkeys in the scientific view', () => {
      pressKey('9');

      const ignored = pressKey('r');
      expect(primaryText()).toBe('9');
      expect(ignored.defaultPrevented).toBe(false);

      pressKey('m');
      const handled = pressKey('r');
      expect(primaryText()).toBe('3');
      expect(handled.defaultPrevented).toBe(true);
    });

    it.each([
      ['s', '0'],
      ['c', '1'],
      ['t', '0'],
      ['S', '0'],
      ['C', '90'],
      ['T', '0'],
      ['r', '0'],
      ['R', '0'],
      ['q', '0'],
    ])('should apply the %s hotkey to the current value', (key, expected) => {
      pressKey('m');
      pressKey(key);
      expect(primaryText()).toBe(expected);
    });

    it('should evaluate an expression typed with hotkeys', () => {
      pressKey('m');
      ['2', '*', '(', '3', '+', '4', ')', '^', '2', 'Enter'].forEach((key) => pressKey(key));
      expect(primaryText()).toBe('98');
    });

    it('should enter modulo with Shift+M without switching views', () => {
      pressKey('m');
      ['7', 'M', '3', 'Enter'].forEach((key) => pressKey(key));
      expect(primaryText()).toBe('1');
      expect(document.body.dataset.mode).toBe('scientific');
    });

    it('should enter logs and constants with hotkeys', () => {
      pressKey('m');
      pressKey('e');
      pressKey('n');
      expect(primaryText()).toBe('1');

      pressKey('p');
      expect(primaryText()).toBe(String(Math.PI));

      ['1', '0', '0', 'l'].forEach((key) => pressKey(key));
      expect(primaryText()).toBe('2');
    });

    it.each([
      ['metaKey'],
      ['ctrlKey'],
      ['altKey'],
    ])('should leave browser shortcuts using %s alone', (modifier) => {
      pressKey('m');
      pressKey('9');

      for (const key of ['r', '1', 'm']) {
        const event = pressKey(key, {[modifier]: true});
        expect(event.defaultPrevented).toBe(false);
      }

      expect(primaryText()).toBe('9');
      expect(document.body.dataset.mode).toBe('scientific');
    });
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
