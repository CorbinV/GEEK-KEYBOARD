import { $t } from '@/locales';

// 宏列表操作选项
enum MenuOptionKey {
  Edit,
  ReName,
  Delete
}

// 宏列表操作选项
const MacrosOps = [
  { label: $t('businessCommon.edit'), key: MenuOptionKey.Edit },
  { type: 'divider' },
  { label: $t('businessCommon.rename'), key: MenuOptionKey.ReName },
  { type: 'divider' },
  { label: $t('businessCommon.delete'), key: MenuOptionKey.Delete }
];

// 宏触发选项
enum TriggerOptionKey {
  Down,
  // Keep,
  Delay,
  Up
}

// 宏触发选项
const TriggerOps = [
  { label: $t('macro.downExe'), value: TriggerOptionKey.Down },
  // { label: '按住触发', value: TriggerOptionKey.Keep },
  { label: $t('macro.downDelayExe'), value: TriggerOptionKey.Delay },
  { label: $t('macro.downDelayExe'), value: TriggerOptionKey.Up }
];

// 宏退出选项
enum QuitOptionKey {
  Normal,
  Click
}

// 宏退出选项
const QuitOps = [
  { label: $t('macro.exeCompleStop'), value: QuitOptionKey.Normal },
  { label: $t('macro.againDownStop'), value: QuitOptionKey.Click }
];

// 显示所有时间
const AllTime = {
  Show: '显示',
  Hide: '隐藏'
};

// 按键状态
const KeyStatusTabs = {
  Down: '按下',
  Up: '抬起'
};

// 宏类型
export const MacroType = {
  MenuOptionKey,
  MacrosOps,
  TriggerOptionKey,
  TriggerOps,
  QuitOptionKey,
  QuitOps,
  AllTime,
  KeyStatusTabs
};
