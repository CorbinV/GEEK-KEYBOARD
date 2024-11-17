// 类型定义
export interface HIDMessage {
  messageId: string;
  name: string;
  payload: any;
}

export interface HIDResponse {
  data?: any;
  code: string;
  name: string;
}

export type MessageCallback = (response: HIDResponse) => void;

export interface HIDProtocolOptions {
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}
export interface FilterType {
  vendorId?: number;
  productId?: number;
  usagePage?: number;
}
export type Request = {
  name: string;
  callback: MessageCallback;
};
