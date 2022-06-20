type JsonFinal = {
  [path: string]: {
    path: string;
    all: boolean;
    statementMap: {
      [statementNumber: string]: {
          "start": {
            "line": number,
            "column": number
          },
          "end": {
            "line": number,
            "column": number
          }
      }
    },
    s: {
      [statementNumber: string]: number
    }
  }
}

export type {
  JsonFinal
};
