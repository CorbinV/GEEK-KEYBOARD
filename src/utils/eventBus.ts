import mitt from 'mitt';
export enum EventNameEnum {
  resetKey = 'resetKey',
  selecteAll = 1,
  reverseSelect,
  selecteClear,
  rtFncReset
}
export type MittEvents = {
  [EventNameEnum.resetKey]: string;
  [EventNameEnum.selecteAll]: null;
  [EventNameEnum.reverseSelect]: null;
  [EventNameEnum.selecteClear]: null;
  [EventNameEnum.rtFncReset]: null;
};

const emitter = mitt<MittEvents>();

export default emitter;
