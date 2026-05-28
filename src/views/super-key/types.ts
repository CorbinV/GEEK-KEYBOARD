import type { Component } from 'vue';
import type { BaseKey, BaseKeyView } from '@/api/modules/combo';
import type { ReName } from '@/api/modules/super-key';
import type { KeyTypeEnum } from '@/enum/keyType';

export type CacheSuperKey = {
  sp: KeyTypeEnum[];
  mt?: BaseKeyView;
  dks: boolean;
  combo: boolean;
};

export type GroupItem = {
  base: { code: number; type: KeyTypeEnum; name: string; key?: string };
  keyList: BaseKeyView[];
  keyBaseList: BaseKey[];
  viewId: string;
};

export interface AddContext {
  currentGroupCount: number;
  maxGroupCount: number;
  selectedKeyIds: string[];
  superKeyMap: Record<string, CacheSuperKey>;
  targetSuperKey: CacheSuperKey | null;
}

export interface ModuleState {
  groupList: GroupItem[];
  loading: boolean;
  extra: Record<string, any>;
}

export interface SuperKeyStrategy {
  keyType: KeyTypeEnum;
  labelKey: string;
  codePrefix: string;
  maxGroupCount: number;
  maxKeyCount: number;
  needSelectKey: boolean;
  enableEdit: boolean;
  enableRename: boolean;
  keyboardType: 'base' | 'standard';
  wide: boolean;

  api: {
    getList: () => Promise<any>;
    addTarget: (data: any) => Promise<any>;
    deleteByCode: (data: { code: number }) => Promise<any>;
    getTarget: (data: any) => Promise<any>;
    rename: (data: ReName) => Promise<any>;
  };

  extractList: (res: any) => any[];
  defaultItemNameKey: string;

  beforeAdd: ((ctx: AddContext) => boolean | Promise<boolean>) | null;
  enhanceCreateData: ((data: any, extraState: Record<string, any>) => any) | null;

  editComponent: Component | null;
  getEditProps: ((state: ModuleState) => Record<string, any>) | null;
  headerExtraComponent: Component | null;
  headerExtraModelKey: string;
  extraComponent: Component | null;
  extraComponentModelKey: string;

  createExtraState: (() => Record<string, any>) | null;
}