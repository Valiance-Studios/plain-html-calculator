import {wrapError} from "@lib/error";

let currentExpression = "";

function setCurrentExpression(expression: string) {
  currentExpression = expression;
}

function getCurrentExpression(): string {
  return currentExpression;
}

function evaluateCurrentExpression(): string {
  try {
    const result = eval(currentExpression);
    return result.toString();
  } catch (error) {
    throw wrapError(error, "Failed to evaluate expression");
  }
}

export {
  setCurrentExpression,
  getCurrentExpression,
  evaluateCurrentExpression,
};