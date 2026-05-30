import type { SuperKeyStrategy } from '../types';
import { KeyTypeEnum } from '@/enum/keyType';
import { $t } from '@/locales';
import {
  addOks, deleteOksByCode, getOksList, getTargetOks, resetOksName,
  addSOCD, deleteSOCDByCode, getSOCDList, getTargetSOCD, resetSOCDName,
  addMT, deleteMTByCode, getMTList, getTargetMT, resetMTName,
  addTGL, deleteTGLByCode, getTargetTGL, getTGLList, resetTGLName,
  addRS, deleteRSByCode, getRSList, getTargetRS, resetRSName,
} from '@/api/super-key';
import SocdTriggerSelect from '../components/socd-trigger-select.vue';
import MtTimeInput from '../components/mt-time-input.vue';
import { dksStrategy } from '../strategies/dks';

export const SOCDTriggerOps = [
  { label: '优先最后按下的按键', value: 0 },
  { label: '优先1号位触发', value: 1 },
  { label: '优先2号位触发', value: 2 }
];

const SIMPLE_MODULE_CONFIGS: Partial<SuperKeyStrategy>[] = [
  {
    keyType: KeyTypeEnum.OKS,
    labelKey: 'supperKey.c2',
    codePrefix: 'O',
    maxKeyCount: 2,
    needSelectKey: false,
    enableEdit: true,
    enableRename: false,
    keyboardType: 'base',
    wide: false,
    api: { getList: getOksList, addTarget: addOks, deleteByCode: deleteOksByCode, getTarget: getTargetOks, rename: resetOksName },
    extractList: (res) => res.oks,
    defaultItemNameKey: 'supperKey.singleKeyStop',
  },
  {
    keyType: KeyTypeEnum.SOCD,
    labelKey: 'supperKey.c9',
    codePrefix: 'S',
    maxKeyCount: 2,
    needSelectKey: false,
    enableEdit: true,
    enableRename: true,
    keyboardType: 'base',
    wide: false,
    api: { getList: getSOCDList, addTarget: addSOCD, deleteByCode: deleteSOCDByCode, getTarget: getTargetSOCD, rename: resetSOCDName },
    extractList: (res) => res.socd,
    defaultItemNameKey: '',
    headerExtraComponent: SocdTriggerSelect,
    createExtraState: () => ({ trigger: 0, socdRawList: [] }),
  },
  {
    keyType: KeyTypeEnum.MT,
    labelKey: 'supperKey.c3',
    codePrefix: 'M',
    maxKeyCount: 2,
    needSelectKey: true,
    enableEdit: true,
    enableRename: false,
    keyboardType: 'standard',
    wide: true,
    api: { getList: () => getMTList({ pageNo: 1, pageSize: 8 }), addTarget: addMT, deleteByCode: deleteMTByCode, getTarget: getTargetMT, rename: resetMTName },
    extractList: (res) => res.mt,
    defaultItemNameKey: 'supperKey.singleKeyStop',
    beforeAdd: (ctx) => {
      if (ctx.targetSuperKey?.dks) {
        window.$message!.info($t('supperKey.keyBinedDKSFunc'));
        return false;
      }
      return true;
    },
    enhanceCreateData: (data, extra) => ({ ...data, time: extra.inputTime }),
    extraComponent: MtTimeInput,
    createExtraState: () => ({ inputTime: 200, mtRawList: [] }),
  },
  {
    keyType: KeyTypeEnum.TGL,
    labelKey: 'supperKey.c4',
    codePrefix: 'T',
    maxKeyCount: 2,
    needSelectKey: true,
    enableEdit: true,
    enableRename: false,
    keyboardType: 'standard',
    wide: true,
    api: { getList: () => getTGLList({ pageNo: 1, pageSize: 8 }), addTarget: addTGL, deleteByCode: deleteTGLByCode, getTarget: getTargetTGL, rename: resetTGLName },
    extractList: (res) => res.tgl,
    defaultItemNameKey: 'supperKey.singleKeyStop',
    beforeAdd: (ctx) => {
      if (ctx.targetSuperKey?.dks) {
        window.$message!.info($t('supperKey.keyBinedDKSFunc'));
        return false;
      }
      if (ctx.targetSuperKey?.sp?.length) {
        window.$message!.info($t('supperKey.keyBinedOtherFunc'));
        return false;
      }
      return true;
    },
  },
  {
    keyType: KeyTypeEnum.RS,
    labelKey: 'supperKey.c5',
    codePrefix: 'R',
    needSelectKey: false,
    enableEdit: true,
    enableRename: false,
    keyboardType: 'base',
    wide: false,
    api: { getList: () => getRSList({ pageNo: 1, pageSize: 8 }), addTarget: addRS, deleteByCode: deleteRSByCode, getTarget: getTargetRS, rename: resetRSName },
    extractList: (res) => res.rs,
    defaultItemNameKey: 'supperKey.c5',
  },
];

function normalizeConfigs(partials: Partial<SuperKeyStrategy>[]): [KeyTypeEnum, SuperKeyStrategy][] {
  return partials.map(p => {
    const strategy: SuperKeyStrategy = {
      keyType: p.keyType!,
      labelKey: p.labelKey!,
      codePrefix: p.codePrefix!,
      maxGroupCount: p.maxGroupCount ?? 8,
      maxKeyCount: p.maxKeyCount ?? 2,
      needSelectKey: p.needSelectKey ?? false,
      enableEdit: p.enableEdit ?? true,
      enableRename: p.enableRename ?? false,
      keyboardType: p.keyboardType ?? 'base',
      wide: p.wide ?? false,
      api: p.api!,
      extractList: p.extractList!,
      defaultItemNameKey: p.defaultItemNameKey!,
      beforeAdd: p.beforeAdd ?? null,
      enhanceCreateData: p.enhanceCreateData ?? null,
      editComponent: p.editComponent ?? null,
      getEditProps: p.getEditProps ?? null,
      headerExtraComponent: p.headerExtraComponent ?? null,
      extraComponent: p.extraComponent ?? null,
      createExtraState: p.createExtraState ?? null,
    };
    return [strategy.keyType, strategy];
  });
}

export const STRATEGY_REGISTRY = new Map<KeyTypeEnum, SuperKeyStrategy>([
  ...normalizeConfigs(SIMPLE_MODULE_CONFIGS),
  [KeyTypeEnum.DKS, dksStrategy],
]);

export const ALL_STRATEGIES = Array.from(STRATEGY_REGISTRY.values());