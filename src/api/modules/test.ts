export type TestBase = {
  enable: CommonType.NumberBoolean;
};
export type TestKeyRes = {
  ks: {
    [key: string]: {
      v: string;
      pr: CommonType.NumberBoolean;
    };
  };
};
