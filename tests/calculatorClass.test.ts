import {Calculator} from '../src/calculatorClass';

describe('Calculator Engine', () => {
  let calc: Calculator;

  beforeEach(() => {
    calc = new Calculator();
  });

  describe('Initial State', () => {
    it('should initialize with display value "0" and empty expression', () => {
      expect(calc.getDisplayValue()).toBe('0');
      expect(calc.getExpressionValue()).toBe('0');
    });
  });

  describe('Number Input & String Manipulation', () => {
    it('should append numbers correctly', () => {
      calc.appendNumber('1');
      calc.appendNumber('2');
      calc.appendNumber('3');
      expect(calc.getDisplayValue()).toBe('123');
    });

    it('should not allow multiple leading zeros', () => {
      calc.appendNumber('0');
      calc.appendNumber('0');
      expect(calc.getDisplayValue()).toBe('0');
    });

    it('should allow only one decimal point per number', () => {
      calc.appendNumber('1');
      calc.appendNumber('.');
      calc.appendNumber('2');
      calc.appendNumber('.');
      calc.appendNumber('3');
      expect(calc.getDisplayValue()).toBe('1.23');
    });

    it('should delete digits correctly', () => {
      calc.appendNumber('1');
      calc.appendNumber('2');
      calc.appendNumber('3');
      calc.delete();
      expect(calc.getDisplayValue()).toBe('12');
    });

    it('should reset display to "0" when last digit is deleted', () => {
      calc.appendNumber('5');
      calc.delete();
      expect(calc.getDisplayValue()).toBe('0');
    });

    it('should reset display to "0" when the last digit of a negative number is deleted', () => {
      calc.appendNumber('5');
      calc.invertSign();
      calc.delete();
      expect(calc.getDisplayValue()).toBe('0');
    });

    it('should not leave leading zeros when "00" is entered first', () => {
      calc.appendNumber('00');
      expect(calc.getDisplayValue()).toBe('0');

      calc.appendNumber('5');
      expect(calc.getDisplayValue()).toBe('5');
    });

    it('should not leave leading zeros when "00" starts the second operand', () => {
      calc.appendNumber('7');
      calc.chooseOperation('+');
      calc.appendNumber('00');
      expect(calc.getDisplayValue()).toBe('0');
    });

    it('should append "00" as two digits after other input', () => {
      calc.appendNumber('5');
      calc.appendNumber('00');
      expect(calc.getDisplayValue()).toBe('500');

      calc.clear();
      calc.appendNumber('.');
      calc.appendNumber('00');
      expect(calc.getDisplayValue()).toBe('0.00');
    });

    it('should start a new "0." when "." follows a result', () => {
      calc.appendNumber('5');
      calc.chooseOperation('+');
      calc.appendNumber('3');
      calc.compute();
      calc.appendNumber('.');
      expect(calc.getDisplayValue()).toBe('0.');
    });
  });

  describe('Percent', () => {
    it('should divide a lone number by 100', () => {
      calc.appendNumber('50');
      calc.percent();
      expect(calc.getDisplayValue()).toBe('0.5');
      expect(calc.getExpressionValue()).toBe('');
    });

    it('should replace a percent result when a new number is typed', () => {
      calc.appendNumber('50');
      calc.percent();
      calc.appendNumber('7');
      expect(calc.getDisplayValue()).toBe('7');
    });

    it('should treat the operand as a percentage of the first operand for + and -', () => {
      calc.appendNumber('200');
      calc.chooseOperation('+');
      calc.appendNumber('10');
      calc.percent();
      expect(calc.getDisplayValue()).toBe('20');
      expect(calc.getExpressionValue()).toBe('200 + 20');

      calc.compute();
      expect(calc.getDisplayValue()).toBe('220');

      calc.clear();
      calc.appendNumber('200');
      calc.chooseOperation('-');
      calc.appendNumber('10');
      calc.percent();
      calc.compute();
      expect(calc.getDisplayValue()).toBe('180');
    });

    it('should treat the operand as a plain fraction for * and /', () => {
      calc.appendNumber('200');
      calc.chooseOperation('*');
      calc.appendNumber('10');
      calc.percent();
      calc.compute();
      expect(calc.getDisplayValue()).toBe('20');

      calc.clear();
      calc.appendNumber('200');
      calc.chooseOperation('/');
      calc.appendNumber('50');
      calc.percent();
      calc.compute();
      expect(calc.getDisplayValue()).toBe('400');
    });

    it('should keep a percent operand when chaining into another operation', () => {
      calc.appendNumber('200');
      calc.chooseOperation('+');
      calc.appendNumber('10');
      calc.percent();
      calc.chooseOperation('+'); // Evaluates 200 + 20 automatically
      expect(calc.getDisplayValue()).toBe('220');
      expect(calc.getExpressionValue()).toBe('220 +');

      calc.appendNumber('5');
      calc.compute();
      expect(calc.getDisplayValue()).toBe('225');
    });

    it('should replace a percent operand when a new number is typed', () => {
      calc.appendNumber('200');
      calc.chooseOperation('+');
      calc.appendNumber('10');
      calc.percent();
      calc.appendNumber('5');
      expect(calc.getExpressionValue()).toBe('200 + 5');

      calc.compute();
      expect(calc.getDisplayValue()).toBe('205');
    });

    it('should avoid floating-point noise', () => {
      calc.appendNumber('7');
      calc.percent();
      expect(calc.getDisplayValue()).toBe('0.07');
    });

    it('should leave the Error state alone', () => {
      calc.appendNumber('5');
      calc.chooseOperation('/');
      calc.appendNumber('0');
      calc.compute();
      calc.percent();
      expect(calc.getDisplayValue()).toBe('Error');
    });
  });

  describe('Order of Operations', () => {
    /** Enters a space-separated expression, e.g. "2 + 3 * 4". */
    const enter = (expression: string): void => {
      expression.split(' ').forEach((token) => {
        if (token === '+' || token === '-' || token === '*' || token === '/') {
          calc.chooseOperation(token);
        } else {
          calc.appendNumber(token);
        }
      });
    };

    it.each([
      ['2 + 3 * 4', '14'],
      ['2 * 3 + 4', '10'],
      ['10 - 2 * 3', '4'],
      ['20 / 4 + 1', '6'],
      ['1 + 2 * 3 + 4', '11'],
      ['2 + 3 * 4 - 6 / 2', '11'],
      ['2 * 3 * 4 + 1', '25'],
    ])('should evaluate %s as %s', (expression, expected) => {
      enter(expression);
      calc.compute();
      expect(calc.getDisplayValue()).toBe(expected);
    });

    it.each([
      ['10 - 3 - 2', '5'],
      ['16 / 4 / 2', '2'],
      ['8 / 2 * 4', '16'],
    ])('should evaluate equal precedence left to right: %s as %s', (expression, expected) => {
      enter(expression);
      calc.compute();
      expect(calc.getDisplayValue()).toBe(expected);
    });

    it('should hold a lower-precedence operation until its right-hand side is resolved', () => {
      enter('2 + 3 *');
      expect(calc.getDisplayValue()).toBe('3');
      expect(calc.getExpressionValue()).toBe('2 + 3 ×');

      enter('4');
      expect(calc.getExpressionValue()).toBe('2 + 3 × 4');
    });

    it('should collapse what it can when a lower-precedence operator is chosen', () => {
      enter('2 + 3 * 4 +');
      expect(calc.getDisplayValue()).toBe('14');
      expect(calc.getExpressionValue()).toBe('14 +');
    });

    it('should resolve only the tighter operation when precedence allows nothing more', () => {
      enter('2 + 3 * 4 *');
      expect(calc.getDisplayValue()).toBe('12');
      expect(calc.getExpressionValue()).toBe('2 + 12 ×');
    });

    it('should re-evaluate precedence when a pending operator is replaced', () => {
      enter('2 + 3 * +');
      expect(calc.getDisplayValue()).toBe('5');
      expect(calc.getExpressionValue()).toBe('5 +');
    });

    it('should replace a lone pending operator', () => {
      enter('6 + *');
      expect(calc.getExpressionValue()).toBe('6 ×');

      enter('2');
      calc.compute();
      expect(calc.getDisplayValue()).toBe('12');
    });

    it('should reuse the displayed value when = follows an operator', () => {
      enter('2 + 3 *');
      calc.compute();
      expect(calc.getDisplayValue()).toBe('11');
    });

    it('should repeat only the last operation on further compute calls', () => {
      enter('2 + 3 * 4');
      calc.compute();
      expect(calc.getDisplayValue()).toBe('14');

      calc.compute();
      expect(calc.getDisplayValue()).toBe('56');
    });

    it('should enter the Error state when a held operation divides by zero', () => {
      enter('1 + 5 / 0');
      calc.compute();
      expect(calc.getDisplayValue()).toBe('Error');
      expect(calc.getExpressionValue()).toBe('Error');
    });

    it('should enter the Error state when choosing an operator resolves a division by zero', () => {
      enter('5 / 0 +');
      expect(calc.getDisplayValue()).toBe('Error');
    });

    it('should recover from the Error state when a new number is typed', () => {
      enter('5 / 0');
      calc.compute();
      calc.appendNumber('3');
      expect(calc.getDisplayValue()).toBe('3');
      expect(calc.getExpressionValue()).toBe('3');
    });

    it('should let delete clear the Error state', () => {
      enter('5 / 0');
      calc.compute();
      calc.delete();
      expect(calc.getDisplayValue()).toBe('0');
    });

    it('should take a percentage of the operand it applies to, within a longer expression', () => {
      enter('100 + 50 + 10');
      calc.percent();
      expect(calc.getDisplayValue()).toBe('15');

      calc.compute();
      expect(calc.getDisplayValue()).toBe('165');
    });

    it('should treat percent as a plain fraction under a pending multiplication', () => {
      enter('100 + 50 * 10');
      calc.percent();
      calc.compute();
      expect(calc.getDisplayValue()).toBe('105');
    });
  });

  describe('Basic Operations', () => {
    it('should perform addition correctly', () => {
      calc.appendNumber('5');
      calc.chooseOperation('+');
      calc.appendNumber('3');
      calc.compute();
      expect(calc.getDisplayValue()).toBe('8');
    });

    it('should perform subtraction correctly', () => {
      calc.appendNumber('1');
      calc.appendNumber('0');
      calc.chooseOperation('-');
      calc.appendNumber('4');
      calc.compute();
      expect(calc.getDisplayValue()).toBe('6');
    });

    it('should perform multiplication correctly', () => {
      calc.appendNumber('6');
      calc.chooseOperation('*');
      calc.appendNumber('7');
      calc.compute();
      expect(calc.getDisplayValue()).toBe('42');
    });

    it('should perform division correctly', () => {
      calc.appendNumber('2');
      calc.appendNumber('0');
      calc.chooseOperation('/');
      calc.appendNumber('4');
      calc.compute();
      expect(calc.getDisplayValue()).toBe('5');
    });
  });

  describe('Edge Cases & Advanced State Behaviors', () => {
    it('should handle floating-point precision issues correctly (0.1 + 0.2)', () => {
      calc.appendNumber('0');
      calc.appendNumber('.');
      calc.appendNumber('1');
      calc.chooseOperation('+');
      calc.appendNumber('0');
      calc.appendNumber('.');
      calc.appendNumber('2');
      calc.compute();
      expect(calc.getDisplayValue()).toBe('0.3');
    });

    it('should handle division by zero with an Error state', () => {
      calc.appendNumber('5');
      calc.chooseOperation('/');
      calc.appendNumber('0');
      calc.compute();
      expect(calc.getDisplayValue()).toBe('Error');
    });

    it('should chain operations automatically (e.g., 5 + 5 + 2 = 12)', () => {
      calc.appendNumber('5');
      calc.chooseOperation('+');
      calc.appendNumber('5');
      calc.chooseOperation('+'); // Evaluates 5+5 to 10 automatically
      expect(calc.getDisplayValue()).toBe('10');

      calc.appendNumber('2');
      calc.compute();
      expect(calc.getDisplayValue()).toBe('12');
    });

    it('should support repeating the last operation on multiple compute calls', () => {
      // 9 + 3 = 12
      calc.appendNumber('9');
      calc.chooseOperation('+');
      calc.appendNumber('3');
      calc.compute();
      expect(calc.getDisplayValue()).toBe('12');

      // Press equals again -> 12 + 3 = 15
      calc.compute();
      expect(calc.getDisplayValue()).toBe('15');

      // Press equals again -> 15 + 3 = 18
      calc.compute();
      expect(calc.getDisplayValue()).toBe('18');
    });

    it('should clear state completely when clear() is invoked', () => {
      calc.appendNumber('9');
      calc.chooseOperation('+');
      calc.appendNumber('9');
      calc.clear();
      expect(calc.getDisplayValue()).toBe('0');
      expect(calc.getExpressionValue()).toBe('0');
    });
  });
});
