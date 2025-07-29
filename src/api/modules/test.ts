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
export type FctKeyRes = {
  ks: {
    [key: string]: {
      v: string;
      pr: CommonType.NumberBoolean;
    };
  };
  sw: {
    [key: string]: {
      v: string;
    };
  };
};
