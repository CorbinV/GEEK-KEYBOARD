export type SetKeyPerf = {
  code: number;
  rate: number[];
  curRate: number;
  axis: number[];
  axisMax: number[];
  axisIndex: number;
  actDeadZone: number[];
  quick: boolean;
  sensitivity: number[];
  deadZone: number[];
  breakOptimize: boolean;
  shakelayer: number[];
  shakeIndex: number;
};

export type Calibration = {
  switch: boolean;
};
export type Rate = {
  rate: [1000, 2000, 4000, 8000];
  index: 0;
};
