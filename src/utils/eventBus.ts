import mitt from 'mitt';
export enum EventNameEnum {
  resetKey = 'resetKey',
  selecteAll = 1,
  reverseSelect,
  selecteClear,
  rtFncReset,
  layerOrConfigChange, // => update keyboard view data
}
export type MittEvents = {
  [EventNameEnum.resetKey]: string;
  [EventNameEnum.selecteAll]: null;
  [EventNameEnum.reverseSelect]: null;
  [EventNameEnum.selecteClear]: null;
  [EventNameEnum.rtFncReset]: null;
  [EventNameEnum.layerOrConfigChange]: null;
};

const emitter = mitt<MittEvents>();

export default emitter;
