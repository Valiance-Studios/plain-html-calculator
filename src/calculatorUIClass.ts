import {Calculator} from './calculatorClass';
import type {Operation} from './operators';
import type {ScientificConstant, ScientificFunction} from './scientificFunctions';

type CalculatorMode = 'basic' | 'scientific';

interface CalculatorInput {
  type: string
  value: string
}

const SCIENTIFIC_HOTKEYS = new Map<string, CalculatorInput>([
  ['(', {type: 'action', value: 'open-parenthesis'}],
  [')', {type: 'action', value: 'close-parenthesis'}],
  ['d', {type: 'action', value: 'toggle-angle'}],
  ['^', {type: 'operator', value: '^'}],
  ['M', {type: 'operator', value: 'mod'}],
  ['s', {type: 'function', value: 'sin'}],
  ['c', {type: 'function', value: 'cos'}],
  ['t', {type: 'function', value: 'tan'}],
  ['S', {type: 'function', value: 'asin'}],
  ['C', {type: 'function', value: 'acos'}],
  ['T', {type: 'function', value: 'atan'}],
  ['n', {type: 'function', value: 'ln'}],
  ['l', {type: 'function', value: 'log'}],
  ['r', {type: 'function', value: 'sqrt'}],
  ['R', {type: 'function', value: 'cbrt'}],
  ['q', {type: 'function', value: 'square'}],
  ['p', {type: 'constant', value: 'pi'}],
  ['e', {type: 'constant', value: 'e'}],
]);

export class CalculatorUI {
  private calculator: Calculator;
  private primaryDisplay: HTMLElement;
  private secondaryDisplay: HTMLElement;
  private modeToggle: HTMLElement;
  private angleToggle: HTMLElement;
  private mode: CalculatorMode = 'basic';
  private actions: Record<string, () => void>;

  constructor(calculator: Calculator) {
    this.calculator = calculator;
    this.primaryDisplay = this.requireElement('display-primary');
    this.secondaryDisplay = this.requireElement('display-secondary');
    this.modeToggle = this.requireElement('btn-toggle-mode');
    this.angleToggle = this.requireElement('btn-toggle-angle');

    this.actions = {
      'clear': () => calculator.clear(),
      'all-clear': () => calculator.clear(),
      'delete': () => calculator.delete(),
      'single-delete': () => calculator.delete(),
      'calculate': () => calculator.compute(),
      '=': () => calculator.compute(),
      'invert-sign': () => calculator.invertSign(),
      'percent': () => calculator.percent(),
      'open-parenthesis': () => calculator.openParenthesis(),
      'close-parenthesis': () => calculator.closeParenthesis(),
      'toggle-angle': () => calculator.toggleAngleUnit(),
      'toggle-mode': () => {
        this.mode = this.mode === 'basic' ? 'scientific' : 'basic';
      },
    };

    this.initEventListeners();
    this.updateDisplay();
  }

  private requireElement(id: string): HTMLElement {
    const element = document.getElementById(id);

    if (!element) {
      throw new Error(`Cannot initialize CalculatorUI: "#${id}" query returned null.`);
    }

    return element;
  }

  private initEventListeners(): void {
    const wrapper = document.querySelector('.calculator-wrapper');
    if (!wrapper) {
      throw new Error('Cannot initialize event listeners: ".calculator-wrapper" query returned null.');
    }

    wrapper.addEventListener('click', (event: Event) => {
      const target = (event.target as HTMLElement).closest('button');
      if (!target) return;
      this.handleInput(target.dataset.type, target.value);
    });

    // iOS Safari only applies :active styles once a touch listener exists on the page.
    document.addEventListener('touchstart', () => {}, {passive: true});

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

      case 'function': {
        this.calculator.applyFunction(value as ScientificFunction);
        break;
      }

      case 'constant': {
        this.calculator.enterConstant(value as ScientificConstant);
        break;
      }

      case 'action': {
        this.actions[value]?.();
        break;
      }
    }

    this.updateDisplay();
  }

  /**
   * Maps raw keyboard events into normalized input types and values.
   */
  private mapKeyboardToInput(event: KeyboardEvent): CalculatorInput | null {
    // Leaves browser shortcuts like Cmd+R and Ctrl+1 alone
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return null;
    }

    const key = event.key;

    if (/^[0-9.]$/.test(key)) {
      return {type: 'number', value: key};
    }

    if (['+', '-', '*', '/'].includes(key)) {
      return {type: 'operator', value: key};
    }

    if (key === '%') {
      return {type: 'action', value: 'percent'};
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

    if (key === 'm') {
      return {type: 'action', value: 'toggle-mode'};
    }

    if (this.mode === 'scientific') {
      return SCIENTIFIC_HOTKEYS.get(key) ?? null;
    }

    return null;
  }

  private updateDisplay(): void {
    this.renderDisplayText(this.primaryDisplay, this.calculator.getDisplayValue());
    this.renderDisplayText(this.secondaryDisplay, this.calculator.getExpressionValue());

    document.body.dataset.mode = this.mode;
    this.modeToggle.textContent = this.mode === 'basic' ? 'SCI' : 'BASIC';
    this.angleToggle.textContent = this.calculator.getAngleUnit().toUpperCase();
  }

  /**
   * Publishes the text length alongside the text so the stylesheet can scale it to fit.
   */
  private renderDisplayText(element: HTMLElement, text: string): void {
    element.textContent = text;
    element.style.setProperty('--display-length', String(Math.max(text.length, 1)));
  }
}
