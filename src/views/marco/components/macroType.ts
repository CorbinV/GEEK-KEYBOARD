// 宏列表操作选项
enum MenuOptionKey {
  Edit,
  ReName,
  Delete
}

// 宏列表操作选项
const MacrosOps = [
  { label: '编辑', key: MenuOptionKey.Edit },
  { type: 'divider' },
  { label: '重命名', key: MenuOptionKey.ReName },
  { type: 'divider' },
  { label: '删除', key: MenuOptionKey.Delete }
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
  { label: '按下触发', value: TriggerOptionKey.Down },
  // { label: '按住触发', value: TriggerOptionKey.Keep },
  { label: '按下延迟触发', value: TriggerOptionKey.Delay },
  { label: '抬起触发', value: TriggerOptionKey.Up }
];

// 宏退出选项
enum QuitOptionKey {
  Normal,
  Click
}

// 宏退出选项
const QuitOps = [
  { label: '执行完停止', value: QuitOptionKey.Normal },
  { label: '再次按下停止', value: QuitOptionKey.Click }
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
