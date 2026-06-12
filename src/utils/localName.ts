/**
 * 本地命名服务
 *
 * 设备侧 setXxName 协议接口已废弃，命名逻辑由应用层承接。
 * 使用 localStorage 存储，key 格式：${type}-${code}，与 Combo 体系已有格式兼容。
 */

/**
 * 获取本地自定义名称
 * @param type  KeyTypeEnum 值
 * @param code  按键编码
 * @returns 自定义名称，不存在返回 null
 */
export function getLocalName(type: number, code: number): string | null {
  return localStorage.getItem(`${type}-${code}`);
}

/**
 * 设置本地自定义名称
 */
export function setLocalName(type: number, code: number, name: string): void {
  localStorage.setItem(`${type}-${code}`, name);
}

/**
 * 删除本地自定义名称
 */
export function removeLocalName(type: number, code: number): void {
  localStorage.removeItem(`${type}-${code}`);
}