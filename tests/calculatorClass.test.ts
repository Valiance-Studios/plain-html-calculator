import {Calculator} from '../src/calculatorClass';
import type {Operation} from '../src/operators';
import type {ScientificFunction} from '../src/scientificFunctions';

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

  describe('Scientific', () => {
    /** Enters a space-separated expression, e.g. "2 * ( 3 + 4 )". */
    const enter = (expression: string): void => {
      expression.split(' ').forEach((token) => {
        if (token === '(') {
          calc.openParenthesis();
        } else if (token === ')') {
          calc.closeParenthesis();
        } else if (['+', '-', '*', '/', 'mod', '^'].includes(token)) {
          calc.chooseOperation(token as Operation);
        } else {
          calc.appendNumber(token);
        }
      });
    };

    const evaluate = (expression: string): string => {
      enter(expression);
      calc.compute();
      return calc.getDisplayValue();
    };

    describe('Parentheses', () => {
      it.each([
        ['( 2 + 3 ) * 4', '20'],
        ['2 * ( 3 + 4 )', '14'],
        ['2 * ( 3 + 4 ) * 5', '70'],
        ['( ( 1 + 2 ) * ( 3 + 4 ) ) * 2', '42'],
        ['10 - ( 2 + 3 )', '5'],
        ['( 2 + 3 * 4 ) * 2', '28'],
      ])('should evaluate %s as %s', (expression, expected) => {
        expect(evaluate(expression)).toBe(expected);
      });

      it('should show an open group in the expression', () => {
        enter('2 * ( 3 + 4');
        expect(calc.getExpressionValue()).toBe('2 × (3 + 4');
      });

      it('should show the group\'s value once closed', () => {
        enter('2 * ( 3 + 4 )');
        expect(calc.getDisplayValue()).toBe('7');
        expect(calc.getExpressionValue()).toBe('2 × 7');
      });

      it('should close open groups on compute', () => {
        expect(evaluate('2 * ( 3 + ( 4 + 1')).toBe('16');
      });

      it('should resolve a bare open group on compute', () => {
        enter('2 * ( 5');
        calc.compute();
        expect(calc.getDisplayValue()).toBe('10');
        expect(calc.getExpressionValue()).toBe('');
      });

      it('should ignore a closing parenthesis with no open group', () => {
        enter('5 )');
        expect(calc.getDisplayValue()).toBe('5');

        calc.appendNumber('1');
        expect(calc.getDisplayValue()).toBe('51');
      });

      it('should multiply when a group follows a typed value', () => {
        expect(evaluate('2 ( 3 + 4 )')).toBe('14');
      });

      it('should multiply when a group follows another group', () => {
        expect(evaluate('( 1 + 1 ) ( 2 + 3 )')).toBe('10');
      });

      it('should start fresh when a group follows a result', () => {
        evaluate('2 + 3');
        expect(evaluate('( 1 + 1 ) * 3')).toBe('6');
      });

      it('should not replace the operator before an open parenthesis', () => {
        enter('2 * ( +');
        expect(calc.getExpressionValue()).toBe('2 × (0 +');
      });

      it('should use the displayed value when a group closes after an operator', () => {
        enter('( 2 + )');
        expect(calc.getDisplayValue()).toBe('4');
      });

      it('should enter the Error state when a group divides by zero', () => {
        enter('( 1 / 0 )');
        expect(calc.getDisplayValue()).toBe('Error');
      });

      it('should start a new expression when a group opens after an error', () => {
        evaluate('1 / 0');
        expect(evaluate('( 1 + 1 )')).toBe('2');
      });
    });

    describe('Power and Modulo', () => {
      it.each([
        ['2 ^ 10', '1024'],
        ['2 ^ 3 ^ 2', '512'],
        ['2 * 3 ^ 2', '18'],
        ['1 + 2 ^ 3 * 2', '17'],
        ['( 2 + 1 ) ^ 2', '9'],
        ['2 ^ ( 1 + 2 )', '8'],
        ['7 mod 3', '1'],
        ['1 + 7 mod 3', '2'],
        ['2 * 7 mod 3', '2'],
      ])('should evaluate %s as %s', (expression, expected) => {
        expect(evaluate(expression)).toBe(expected);
      });

      it('should keep the sign of the first operand for modulo', () => {
        enter('7');
        calc.invertSign();
        enter('mod 3');
        calc.compute();
        expect(calc.getDisplayValue()).toBe('-1');
      });

      it('should enter the Error state for modulo by zero', () => {
        expect(evaluate('7 mod 0')).toBe('Error');
      });

      it('should enter the Error state for a result too large to represent', () => {
        expect(evaluate('10 ^ 400')).toBe('Error');
      });

      it('should keep very large results', () => {
        expect(evaluate('10 ^ 300')).toBe('1e+300');
      });

      it('should keep very small results', () => {
        enter('10 ^ 13');
        calc.invertSign();
        calc.compute();
        expect(calc.getDisplayValue()).toBe('1e-13');
      });

      it('should label modulo in the expression', () => {
        enter('7 mod');
        expect(calc.getExpressionValue()).toBe('7 mod');
      });
    });

    describe('Functions', () => {
      const applyTo = (input: string, scientificFunction: ScientificFunction): string => {
        calc.clear();
        calc.appendNumber(input);
        calc.applyFunction(scientificFunction);
        return calc.getDisplayValue();
      };

      it.each<[string, ScientificFunction, string]>([
        ['30', 'sin', '0.5'],
        ['90', 'sin', '1'],
        ['180', 'sin', '0'],
        ['60', 'cos', '0.5'],
        ['90', 'cos', '0'],
        ['45', 'tan', '1'],
        ['180', 'tan', '0'],
        ['1', 'asin', '90'],
        ['1', 'acos', '0'],
        ['1', 'atan', '45'],
      ])('should evaluate in degrees by default: %s %s is %s', (input, scientificFunction, expected) => {
        expect(applyTo(input, scientificFunction)).toBe(expected);
      });

      it.each<[string, ScientificFunction, string]>([
        ['1000', 'log', '3'],
        ['1', 'ln', '0'],
        ['9', 'sqrt', '3'],
        ['27', 'cbrt', '3'],
        ['12', 'square', '144'],
      ])('should evaluate %s %s as %s', (input, scientificFunction, expected) => {
        expect(applyTo(input, scientificFunction)).toBe(expected);
      });

      it.each<[string, ScientificFunction]>([
        ['90', 'tan'],
        ['2', 'asin'],
        ['2', 'acos'],
        ['0', 'ln'],
        ['0', 'log'],
      ])('should enter the Error state where undefined: %s %s', (input, scientificFunction) => {
        expect(applyTo(input, scientificFunction)).toBe('Error');
      });

      it('should enter the Error state for the square root of a negative number', () => {
        calc.appendNumber('4');
        calc.invertSign();
        calc.applyFunction('sqrt');
        expect(calc.getDisplayValue()).toBe('Error');
      });

      it('should find the cube root of a negative number', () => {
        calc.appendNumber('8');
        calc.invertSign();
        calc.applyFunction('cbrt');
        expect(calc.getDisplayValue()).toBe('-2');
      });

      it('should use radians once toggled', () => {
        expect(calc.getAngleUnit()).toBe('deg');

        calc.toggleAngleUnit();
        expect(calc.getAngleUnit()).toBe('rad');

        calc.enterConstant('pi');
        calc.applyFunction('sin');
        expect(calc.getDisplayValue()).toBe('0');

        calc.clear();
        calc.appendNumber('1');
        calc.applyFunction('atan');
        expect(calc.getDisplayValue()).toBe('0.785398163397');
      });

      it('should keep the angle unit through clear', () => {
        calc.toggleAngleUnit();
        calc.clear();
        expect(calc.getAngleUnit()).toBe('rad');
      });

      it('should use a result as an operand within a longer expression', () => {
        enter('2 + 9');
        calc.applyFunction('sqrt');
        expect(calc.getExpressionValue()).toBe('2 + 3');

        enter('* 2');
        calc.compute();
        expect(calc.getDisplayValue()).toBe('8');
      });

      it('should apply to the displayed value right after an operator', () => {
        enter('9 +');
        calc.applyFunction('sqrt');
        calc.compute();
        expect(calc.getDisplayValue()).toBe('12');
      });

      it('should replace a function result when a new number is typed', () => {
        calc.appendNumber('9');
        calc.applyFunction('sqrt');
        calc.appendNumber('7');
        expect(calc.getDisplayValue()).toBe('7');
      });

      it('should multiply when a group follows a function result', () => {
        calc.appendNumber('9');
        calc.applyFunction('sqrt');
        expect(evaluate('( 1 + 1 )')).toBe('6');
      });

      it('should leave the Error state alone', () => {
        evaluate('1 / 0');
        calc.applyFunction('sqrt');
        expect(calc.getDisplayValue()).toBe('Error');
      });
    });

    describe('Constants', () => {
      it('should enter constants at full precision', () => {
        calc.enterConstant('pi');
        expect(calc.getDisplayValue()).toBe(String(Math.PI));

        calc.enterConstant('e');
        expect(calc.getDisplayValue()).toBe(String(Math.E));
      });

      it('should use a constant as an operand', () => {
        enter('2 *');
        calc.enterConstant('pi');
        calc.compute();
        expect(calc.getDisplayValue()).toBe('6.28318530718');
      });

      it('should invert ln with e', () => {
        calc.enterConstant('e');
        calc.applyFunction('ln');
        expect(calc.getDisplayValue()).toBe('1');
      });

      it('should recover from the Error state', () => {
        evaluate('1 / 0');
        calc.enterConstant('e');
        expect(calc.getDisplayValue()).toBe(String(Math.E));
      });
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
