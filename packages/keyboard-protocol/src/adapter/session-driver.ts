/**
 * 会话驱动适配层
 *
 * 封装 vendor/KeyboardAPI.ts 的 createSession，提供给 UsbTransfor.executeSession() 驱动。
 * 当前直接透传，未来如需增加校验、日志、错误转换等，在此处扩展。
 */

import {
  createSession as vendorCreateSession,
  type SessionRequest,
  type DeviceSession,
  type SessionResultMap,
} from '../vendor/KeyboardAPI';

export type { SessionRequest, DeviceSession, SessionResultMap } from '../vendor/KeyboardAPI';

export type SessionWithMeta<T> = DeviceSession<T> & { _requestName: string; _requestData: any };

export function createSession<T extends SessionRequest>(
  request: T,
): SessionWithMeta<SessionResultMap[T["name"]]>;
export function createSession(request: SessionRequest): SessionWithMeta<unknown> {
  let session = vendorCreateSession(request) as SessionWithMeta<unknown>;
  if (!session) {
    session = {} as SessionWithMeta<unknown>
  }
  session._requestName = request.name;
  session._requestData = request.data;
  return session;
}
