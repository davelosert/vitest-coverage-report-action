const thisIsNotTeste = (...params: any[]) => {
  // calculate the sum of all parameters
  return params.reduce((a, b) => a + b, 0);
}

export {
  thisIsNotTeste
};
