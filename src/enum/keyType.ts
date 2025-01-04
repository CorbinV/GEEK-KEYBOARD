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
