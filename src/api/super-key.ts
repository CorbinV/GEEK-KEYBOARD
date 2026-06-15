import requestClient from './config';
import { createSession, type SessionRequestData } from '@sa/keyboard-protocol';
import { KeyTypeEnum } from '@/enum/keyType';

// OKS
export function getOksList(data?: SessionRequestData<'getOKSList'>) {
  return requestClient.executeSession(
    createSession({
      name: 'getOKSList',
      data
    })
  );
}
export function getTargetOks(data: SessionRequestData<'getOKS'>) {
  return requestClient.executeSession(
    createSession({
      name: 'getOKS',
      data
    })
  );
}
export function addOks(data: SessionRequestData<'setOKS'>) {
  return requestClient.executeSession(
    createSession({
      name: 'setOKS',
      data
    })
  );
}
// export function resetOksName(data: ReName) {
//   return requestClient.send<never>({
//     name: 'setOKSName',
//     data
//   });
// }
export function deleteOksByCode(data: SessionRequestData<'delOKS'>) {
  return requestClient.executeSession(
    createSession({
      name: 'delOKS',
      data
    })
  );
}

// SOCD
export function getSOCDList(data?: SessionRequestData<'getSOCDList'>) {
  return requestClient.executeSession(
    createSession({
      name: 'getSOCDList',
      data
    })
  );
}
export function getTargetSOCD(data: SessionRequestData<'getSOCD'>) {
  return requestClient.executeSession(
    createSession({
      name: 'getSOCD',
      data
    })
  );
}
export function addSOCD(data: SessionRequestData<'setSOCD'>) {
  return requestClient.executeSession(
    createSession({
      name: 'setSOCD',
      data
    })
  );
}
// export function resetSOCDName(data: ReName) {
//   return requestClient.send<never>({
//     name: 'setSOCDName',
//     data
//   });
// }
export function deleteSOCDByCode(data: SessionRequestData<'delSOCD'>) {
  return requestClient.executeSession(
    createSession({
      name: 'delSOCD',
      data
    })
  );
}

// RS
export function getRSList(data: SessionRequestData<'getRSList'>) {
  return requestClient.executeSession(
    createSession({
      name: 'getRSList',
      data
    })
  );
}
export function getTargetRS(data: SessionRequestData<'getRS'>) {
  return requestClient.executeSession(
    createSession({
      name: 'getRS',
      data
    })
  );
}
export function addRS(data: SessionRequestData<'setRS'>) {
  return requestClient.executeSession(
    createSession({
      name: 'setRS',
      data
    })
  );
}
// export function resetRSName(data: ReName) {
//   return requestClient.send<never>({
//     name: 'setRSName',
//     data
//   });
// }
export function deleteRSByCode(data: SessionRequestData<'delRS'>) {
  return requestClient.executeSession(
    createSession({
      name: 'delRS',
      data
    })
  );
}

// MT
export function getMTList(data: SessionRequestData<'getMTList'>) {
  return requestClient.executeSession(
    createSession({
      name: 'getMTList',
      data
    })
  );
}
export function getTargetMT(data: SessionRequestData<'getMT'>) {
  return requestClient.executeSession(
    createSession({
      name: 'getMT',
      data
    })
  );
}
export function addMT(data: SessionRequestData<'setMT'>) {
  return requestClient.executeSession(
    createSession({
      name: 'setMT',
      data
    })
  );
}
// export function resetMTName(data: ReName) {
//   return requestClient.send<never>({
//     name: 'setMTName',
//     data
//   });
// }
export function deleteMTByCode(data: SessionRequestData<'delMT'>) {
  return requestClient.executeSession(
    createSession({
      name: 'delMT',
      data
    })
  );
}

// TGL
export function getTGLList(data: SessionRequestData<'getTGLList'>) {
  return requestClient.executeSession(
    createSession({
      name: 'getTGLList',
      data
    })
  );
}
export function getTargetTGL(data: SessionRequestData<'getTGL'>) {
  return requestClient.executeSession(
    createSession({
      name: 'getTGL',
      data
    })
  );
}
export function addTGL(data: SessionRequestData<'setTGL'>) {
  return requestClient.executeSession(
    createSession({
      name: 'setTGL',
      data
    })
  );
}
// export function resetTGLName(data: ReName) {
//   return requestClient.send<never>({
//     name: 'setTGLName',
//     data
//   });
// }
export function deleteTGLByCode(data: SessionRequestData<'delTGL'>) {
  return requestClient.executeSession(
    createSession({
      name: 'delTGL',
      data
    })
  );
}

// DKS
export function getDksList() {
  return requestClient.executeSession(
    createSession({
      name: 'getDKSList'
    })
  );
}
export function getTargetDks(data: SessionRequestData<'getDKS'>) {
  return requestClient.executeSession(
    createSession({
      name: 'getDKS',
      data
    })
  );
}
export function addDks(data: SessionRequestData<'setDKS'>) {
  return requestClient.executeSession(
    createSession({
      name: 'setDKS',
      data
    })
  );
}
// export function resetDksName(data: ReName) {
//   return requestClient.send<never>({
//     name: 'setDKSName',
//     data
//   });
// }
export function deleteDksByCode(data: SessionRequestData<'delDKS'>) {
  return requestClient.executeSession(
    createSession({
      name: 'delDKS',
      data
    })
  );
}

export function deleteSpByCode(data: { type: KeyTypeEnum; code: number }) {
  let name = '';
  switch (data.type) {
    case KeyTypeEnum.Combo:
      name = 'delOKS';
      break;
    case KeyTypeEnum.DKS:
      name = 'delDKS';
      break;
    case KeyTypeEnum.MT:
      name = 'delMT';
      break;
    case KeyTypeEnum.RS:
      name = 'delRS';
      break;
    case KeyTypeEnum.TGL:
      name = 'delTGL';
      break;
    case KeyTypeEnum.SOCD:
      name = 'delSOCD';
      break;
    default:
      break;
  }
  if (!name) {
    return Promise.reject('ILINVALID_PARAM');
  }
  return requestClient.executeSession(
    createSession({
      name: name as any,
      data: {
        code: data.code
      }
    })
  );
}
