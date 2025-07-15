export enum SOCDMode {
  upPriorityMode,
  centerReset,
  lastInputPriority,
}
export type SocdBase = {
  mode: SOCDMode
}
