// 类型定义
export interface HIDMessage {
  messageId: string;
  name: string;
  payload: any;
}

export interface HIDResponse<T extends any> {
  d?: T;
  e: string;
  c: string;
}

export type MessageCallback = <T>(response: HIDResponse<T>) => void;

export interface HIDProtocolOptions {
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}
export interface FilterType {
  vendorId?: number;
  productId?: number;
  usagePage?: number;
  reportId?: number;
}
export type Request = {
  name: string;
  timeoutId: NodeJS.Timeout;
  callback: MessageCallback;
};
