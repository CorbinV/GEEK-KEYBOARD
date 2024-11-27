import { KeyTypeEnum } from '@/enum/keyType';

export function tranformKeyTypeToChar(type: KeyTypeEnum) {
  switch (type) {
    case KeyTypeEnum.OKS:
      return 'O';
    case KeyTypeEnum.SOCD:
      return 'S';
    case KeyTypeEnum.RS:
      return 'R';
    case KeyTypeEnum.TGL:
      return 'T';
    default:
      return '';
  }
}
export function tranformKeyTypeToColor(type: KeyTypeEnum) {
  switch (type) {
    case KeyTypeEnum.OKS:
      return '#9747FF';
    case KeyTypeEnum.SOCD:
      return '#2E9E12';
    case KeyTypeEnum.RS:
      return '#0EAAB4';
    case KeyTypeEnum.TGL:
      return '#B40EAE';
    default:
      return 'transparent';
  }
}
