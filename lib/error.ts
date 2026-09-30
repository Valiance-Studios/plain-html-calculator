function wrapError(error: Error | unknown, message: string): Error {
  if (error instanceof Error) {
    return new Error(`${message}: ${error.message}`);
  } else {
    return new Error(message);
  }
}

export {
  wrapError,
};
