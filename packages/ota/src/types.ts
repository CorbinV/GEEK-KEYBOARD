export type SendFncType = (data: any, options?: { withoutResponse?: boolean; msgId?: string }) => Promise<any> | null;
