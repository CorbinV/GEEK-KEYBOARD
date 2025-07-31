import { readonly, ref } from 'vue';
import { OtaStatusEnum } from '@/enum';
export { wch585Cmd } from '@sa/ota';
// import { useDeviceOta } from '@/hooks/business/useDeviceOta';
export interface VersionInfo {
  [key: `${number}`]: string;
  journal_cn: string;
  journal_en: string;
  version: number;
}

interface Result {
  otaList: VersionInfo[];
  versionList: number[];
}
export function useVersionInfo(deviceHd: any) {
  // const url = 'https://ota-public.oss-cn-shenzhen.aliyuncs.com/test-ota/HITBOX/WCH_3mode_ms_585.bin';
  const baseUrl = 'https://ota-public.oss-cn-shenzhen.aliyuncs.com';
  const model = deviceHd.modal || '';
  const otaEnv = `${import.meta.env.VITE_OTA_TYPE}`;
  const verJson = 'release_ota_update_android.json';

  const upgradeIds: `${number}`[] = [];
  const remoteVersionInfo = ref<VersionInfo & { urls: URL[]; isLastVersion: boolean }>({
    version: 0,
    journal_cn: '',
    journal_en: '',
    isLastVersion: false,
    urls: []
  });

  const isLastVersion = (
    ops: {
      localVersion: string;
      remoteVersion: number;
    },
    extra?: {
      islocal?: boolean;
    }
  ): boolean => {
    const { localVersion, remoteVersion } = ops;
    const { islocal = false } = extra || {};
    const localVerList = localVersion?.split('.').map(i => Number.parseInt(i, 10));
    const remoteVerList = [Math.floor(remoteVersion / 100), remoteVersion % 100];
    localVerList.forEach((lv, idx) => {
      if (lv) {
        const condition =
          import.meta.env.VITE_NODE_ENV === 'production' ? remoteVerList[idx] > lv : remoteVerList[idx] >= lv;
        if (islocal || condition) {
          upgradeIds.push(`${idx}`);
        }
      }
    });
    upgradeIds.sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10));
    return upgradeIds.length === 0;
  };
  const formatRemoteVersionInfo = (data: Result) => {
    const { otaList: list } = data;
    const numberKey = Object.keys(list[0]).filter(k => /^\d+$/.test(k));
    remoteVersionInfo.value = {
      ...list[0],
      isLastVersion: isLastVersion({
        localVersion: deviceHd.version,
        remoteVersion: list[0].version
      }),
      journal_cn: list[0].journal_cn.replace(/\n/g, '<br>'),
      journal_en: list[0].journal_en.replace(/\n/g, '<br>'),
      urls: numberKey
        .map(key => {
          // @ts-ignore
          const uri = list[0][key];
          if (uri) {
            return `${baseUrl}/${otaEnv}/${model}/${uri}` as unknown as URL;
          }
          return null;
        })
        .filter((i): i is URL => Boolean(i))
        .sort()
    };
  };
  const fetchLastVersion = async (cb?: (data: Result) => void) => {
    const res = [false, null] as [boolean, any];
    try {
      const url = `${baseUrl}/${otaEnv}/${model}/${verJson}`;

      const response = await fetch(url);
      if (!response.ok) {
        return [false, 'otaHooks.fetchVersionFail'];
      }
      const { version_list: versionList, ota_list: otaList } = (await response.json()) as any; // Result
      const data = { versionList, otaList } as Result;
      if (data.otaList.length === 0) {
        return [false, 'otaHooks.noVersionInfo'];
      }
      if (cb instanceof Function) {
        cb(data);
      }
      return [true, null];
    } catch (error) {
      res[1] = 'otaHooks.fetchVersionFail';
      window?.$log!.error('Catch error in fetchLastVersion', error);
      return res;
    }
  };

  const versionCheck = async () => {
    const [hasLastVersion, errMsg] = await fetchLastVersion(formatRemoteVersionInfo);
    if (!hasLastVersion) {
      return [false, errMsg];
    }
    if (remoteVersionInfo.value.isLastVersion) {
      return [false, 'otaHooks.firmwareIsLatest'];
    }
    return [true, null];
  };
  const resetUpgradeIds = () => {
    upgradeIds.length = 0;
  };
  const getLastVersionUrl = (data?: Result) => {
    if (remoteVersionInfo.value.urls.length > 0) {
      return remoteVersionInfo.value.urls;
    }
    if (!data) {
      return [];
    }
    const { otaList: list } = data;
    const numberKey = Object.keys(list[0]).filter(k => /^\d+$/.test(k));
    return numberKey
      .map(key => {
        const uri = (list[0] as any)[key];
        if (uri) {
          return `${baseUrl}/${otaEnv}/${model}/${uri}` as unknown as URL;
        }
        return null;
      })
      .filter((i): i is URL => Boolean(i))
      .sort();
  };
  return {
    remoteVersionInfo,
    isLastVersion,
    fetchLastVersion,
    versionCheck,
    resetUpgradeIds,
    upgradeIds: readonly(upgradeIds),
    version: remoteVersionInfo.value.version,
    getLastVersionUrl
  };
}

export async function useOTA(url: URL) {
  const { useDeviceOta } = await import('@/hooks/business/useDeviceOta');
  const { otaInstance } = useDeviceOta();
  const initOtaCtrl = () => ({
    status: OtaStatusEnum.IDLE,
    progress: 0
  });
  const otaCtrl = ref(initOtaCtrl());
  const resetOtaCtrl = () => (otaCtrl.value = initOtaCtrl());
  const downLoadFirmwareAsUint8 = async (fileUrl: string) => {
    const res: [boolean | Uint8Array, null | string] = [false, null];
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) {
        res[1] = 'otaHooks.fetchFirmwareFail';
        return res;
      }
      const arrayBuffer = await response.arrayBuffer();
      const firmwareBuf = new Uint8Array(arrayBuffer);

      res[0] = firmwareBuf;
    } catch (error) {
      window?.$log!.error('Catch error in downLoadFirmwareAsUint8', error);
      res[1] = 'otaHooks.fetchFirmwareFail';
    }
    return res;
  };
  const startOTA = async (firmware: Uint8Array) => {
    try {
      resetOtaCtrl();
      otaInstance.setFileContent(firmware);
      const enableSuccess = await otaInstance.enableOtaMode(true);
      otaCtrl.value.status = OtaStatusEnum.UPGRADE;
      if (!enableSuccess) {
        throw new Error('Enable ota mode failed');
      }
      const transferEnd = await otaInstance.transferContentData({
        onProgress: (p: number) => {
          otaCtrl.value.progress = p;
        }
      });
      if (!transferEnd) {
        throw new Error('transform faild');
      }
      otaCtrl.value.status = OtaStatusEnum.UPGRADE_SUCCESS;
    } catch (error) {
      console.log(error);
      otaCtrl.value.status = OtaStatusEnum.UPGRADE_FAIL;
    }
  };
  const onlineOta = async () => {
    const [otaInfo, _downloadErrMsg] = await downLoadFirmwareAsUint8(url);

    const firmwareBuf = otaInfo as Uint8Array;
    await startOTA(firmwareBuf);
  };
  return {
    onlineOta,
    otaCtrl,
    resetOtaCtrl
  };
}
