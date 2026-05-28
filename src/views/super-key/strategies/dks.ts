import type { SuperKeyStrategy } from '../types';
import { KeyTypeEnum } from '@/enum/keyType';
import { addDks, deleteDksByCode, getDksList, getTargetDks, resetDksName } from '@/api/super-key';
import DksEdit from '../components/dks-edit.vue';

export const dksStrategy: SuperKeyStrategy = {
  keyType: KeyTypeEnum.DKS,
  labelKey: 'supperKey.c1',
  codePrefix: 'D',
  maxGroupCount: 8,
  maxKeyCount: 4,
  needSelectKey: false,
  enableEdit: false,
  enableRename: false,
  keyboardType: 'standard',
  wide: false,

  api: {
    getList: getDksList,
    addTarget: addDks,
    deleteByCode: deleteDksByCode,
    getTarget: getTargetDks,
    rename: resetDksName,
  },
  extractList: (res) => res.shortcuts,
  defaultItemNameKey: '',

  beforeAdd: null,
  enhanceCreateData: (data, extra) => ({
    ...data,
    type: KeyTypeEnum.DKS,
    simulation: extra.simulateStatus,
    simulationRange:
      extra.simulateStatus > 0 ? [extra.simulateDelayTimes.v1, extra.simulateDelayTimes.v2] : [],
  }),

  editComponent: DksEdit,
  getEditProps: (state) => ({
    simulateStatus: state.extra.simulateStatus,
    simulateDelayTimes: state.extra.simulateDelayTimes,
  }),
  headerExtraComponent: null,
  headerExtraModelKey: '',
  extraComponent: null,
  extraComponentModelKey: '',

  createExtraState: () => ({
    simulateStatus: 0 as 0 | 1 | 2,
    simulateDelayTimes: { v1: 0, v2: 0 },
  }),
};