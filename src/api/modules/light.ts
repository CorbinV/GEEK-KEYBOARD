// export type SetKeyPerf = {
//   code: number;
//   rate: number[];
//   curRate: number;
//   axis: number[];
//   axisMax: number[];
//   axisIndex: number;
//   actDeadZone: number[];
//   quick: boolean;
//   sensitivity: number[];
//   deadZone: number[];
//   breakOptimize: boolean;
//   shakelayer: number[];
//   shakeIndex: number;
// };

// - isRGB: 彩色灯光开关（０：模式灯光，１：彩色灯光）
// - pattern : 灯光模式（０～４）
// - brightness: 灯光亮度（０～100）
// - speed: 灯光速度（０～100）
// - sleep: 灯光休眠（单位：分钟；0：不休眠）
// - R: 红色值（０～255）
// - G: 绿色值（０～255）
// - B: 蓝色值（０～255）
export type Light = {
  isRGB: number;
  pattern: number;
  brightness: number;
  speed: number;
  sleep: number;
  R: number;
  G: number;
  B: number;
};
