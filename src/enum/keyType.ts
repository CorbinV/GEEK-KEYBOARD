export enum KeyTypeEnum {
  Normal,
  System,
  Media,
  Combo,
  Special,
  DKS,
  Marco,
  OKS,
  SOCD,
  MT,
  TGL,
  RS,
  None
}
type EnumKeys = keyof typeof KeyTypeEnum;
export const keyTypeEnumProxy = new Proxy(KeyTypeEnum, {
  get(target: any, prop: string) {
    if (prop === 'getKey') {
      return (value: number) => {
        const arr = Object.keys(target) as string[];
        return arr.find(key => target[key] === value);
      };
    }
    return target[prop];
  }
}) as typeof KeyTypeEnum & {
  getKey(value: KeyTypeEnum): EnumKeys | undefined;
};
export enum DeviceLinkEnum {
  USB = 'USB',
  BLE = 'BLE',
  '2.4G' = '2.4G'
}
export const deviceLinkEnumProxy = new Proxy(DeviceLinkEnum, {
  get(target: any, prop: string) {
    if (prop === 'getKey') {
      return (value: number) => {
        const arr = Object.keys(target) as string[];
        return arr.find((key, idx) => {
          if(idx === value){
            return target[key];
          }
        });
      };
    }
    return target[prop];
  }
})
