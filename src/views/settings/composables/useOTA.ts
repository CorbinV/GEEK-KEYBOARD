import { ref, toRaw } from 'vue';
import { useDeviceOta } from '@/hooks/business/useDeviceOta';
import { DeviceInfo } from '@/api/modules/keyboard-setting';
import { downloadAsZip, unzipFile, readFileAsTarget } from './file-controller';
export interface VersionInfo {
  journal_cn: string;
  journal_en: string;
  version: number;
  [key: `${number}`]: string
}

interface Result {
  otaList: VersionInfo[];
  versionList: number[],
}
const { otaInstance, BIT_CONDITION } = useDeviceOta();
function calcBufferSum(data: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
  }
  return sum;
}
export enum OtaStatusEnum {
  IDLE,
  UPGRADE,
  UPGRADE_SUCCESS,
  UPGRADE_FAIL
}
export function useOTA(deviceHd: DeviceInfo & { model: string, version: string }) {
  const baseUrl = 'https://ota-public.oss-cn-shenzhen.aliyuncs.com';
  const model = ref(deviceHd.model);
  const otaEnv = `${import.meta.env.VITE_OTA_TYPE}`;
  const verJson = '/release_ota_update_android.json';
  const loading = ref(false);
  // mtu  从设备读取
  // const mtu = 64;
  const remoteVersionInfo = ref<VersionInfo & { isLastVersion: boolean }>({
    version: 0,
    journal_cn: '',
    journal_en: '',
    isLastVersion: false
  });
  const updateFirmwareId: `${number}`[] = []

  const otaCtrl = ref({
    status: OtaStatusEnum.IDLE,
    progress: 0,
    errMsg: ''
  })

  const startOTA = async (firmware: Uint8Array, fileContentSum: number, upgradeId = 0) => {
    const remoteVerList = [Math.floor(remoteVersionInfo.value.version / 100), remoteVersionInfo.value.version % 100];

    otaCtrl.value.progress = 0;
    // start
    try {
      const fileByteSize = firmware.length;
      otaInstance.setFileContent(firmware);
      const enableSuccess = await otaInstance.enableOtaMode({
        v: remoteVerList[upgradeId],
        s1: (fileContentSum >> 8) & 0xff,
        s2: fileContentSum,
        l1: fileByteSize > BIT_CONDITION ? (fileByteSize >> 8) & 0xff : fileByteSize >> 8,
        l2: fileByteSize,
        id: upgradeId
      });
      if (!enableSuccess) {
        throw new Error('Enable ota mode failed')
      }
    } catch (error) {
      window.$log!.error('Catch error in enable ota', error);
      otaCtrl.value.errMsg = 'otaHooks.upgradeFailDevice'
      otaCtrl.value.status = OtaStatusEnum.UPGRADE_FAIL
    }
    if (otaCtrl.value.status === OtaStatusEnum.UPGRADE_FAIL) {
      return false
    }
    // send
    const upgradeListLen = updateFirmwareId.length
    const transferEnd = await otaInstance.transferContentData({
      onProgress: (process: number) => {
        console.log('current process', process)
        otaCtrl.value.progress = process / upgradeListLen
      }
    });
    if (!transferEnd) {
      otaCtrl.value.status = OtaStatusEnum.UPGRADE_FAIL
      otaCtrl.value.errMsg = 'otaHooks.upgradeFailDevice'
      window.$log!.error('Catch error in ota transferContentData');
      return false
    }
    // end
    try {
      const upgradeSuccess = await otaInstance.checkOtaStatus();
      if (!upgradeSuccess) {
        otaCtrl.value.errMsg = 'otaHooks.upgradeFailDevice'
        otaCtrl.value.status = OtaStatusEnum.UPGRADE_FAIL
      }
    } catch (error) {
      window.$log?.error('Catch error in checkOtaStatus', error);
      otaCtrl.value.errMsg = 'otaHooks.upgradeFailDevice'
      otaCtrl.value.status = OtaStatusEnum.UPGRADE_FAIL
      return false
    }
    otaCtrl.value.status = OtaStatusEnum.UPGRADE_SUCCESS
    otaCtrl.value.errMsg = ''
    return true
  };
  const isLastVersion = (localVersion: string, remoteVersion: number, updateFirmwareId: string[], islocal?: boolean): boolean => {
    const localVerList = localVersion.split('.').map(i => parseInt(i));
    const remoteVerList = [Math.floor(remoteVersion / 100), remoteVersion % 100];
    localVerList.forEach((lv, idx) => {
      if (lv) {
        if (islocal || remoteVerList[idx] >= lv) {
          updateFirmwareId.push(`${idx}`);

        }
      }
    });
    updateFirmwareId.sort((a, b) => parseInt(a) - parseInt(b));
    return updateFirmwareId.length === 0;
  };
  const formatRemoteVersionInfo = (list: VersionInfo[]) => {
    remoteVersionInfo.value = Object.assign({}, list[0],
      {
        isLastVersion: isLastVersion(deviceHd.version, list[0].version, updateFirmwareId),
        journal_cn: list[0].journal_cn.replace(/\n/g, '<br>'),
        journal_en: list[0].journal_en.replace(/\n/g, '<br>')
      }
    );
  }
  const fetchLastVersion = async () => {
    const url = `${baseUrl}/${otaEnv}/${model.value}${verJson}`;

    loading.value = true;
    const response = await fetch(url);
    if (!response.ok) {
      return [false, 'otaHooks.fetchVersionFail'];
    }
    loading.value = false;
    const { version_list: versionList, ota_list: otaList } = await response.json() as any; // Result
    const data = { versionList, otaList } as Result
    if (data.otaList.length === 0) {
      return [false, 'otaHooks.noVersionInfo'];
    }
    formatRemoteVersionInfo(data.otaList)
    return [true, null]
  }
  const downLoadFirmwareAsUint8 = async (fileUrl: string) => {
    let res: [boolean | Uint8Array, null | string] = [false, null]
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) {
        res[1] = 'otaHooks.fetchFirmwareFail'
        return res;
      }
      const arrayBuffer = await response.arrayBuffer();
      const firmwareBuf = new Uint8Array(arrayBuffer);

      res[0] = firmwareBuf;
    } catch (error) {
      window?.$log!.error('Catch error in downLoadFirmwareAsUint8', error);
      res[1] = 'otaHooks.fetchFirmwareFail'
    }
    return res;
  }
  const versionCheck = async () => {
    const [hasLastVersion, errMsg] = await fetchLastVersion();
    if (!hasLastVersion) {
      return [false, errMsg]
    }
    if (remoteVersionInfo.value.isLastVersion) {
      return [false, 'otaHooks.firmwareIsLatest'];
    }
    return [true, null]
  }
  const onlineOta = async () => {
    try {
      const res: [boolean, null | string][] = []
      for await (const id of updateFirmwareId) {
        const firmwareUri = remoteVersionInfo.value[id]
        if (!firmwareUri) {
          continue
        }
        const url = `${baseUrl}/${otaEnv}/${model.value}/${firmwareUri}`;
        const [otaInfo, downloadErrMsg] = await downLoadFirmwareAsUint8(url)
        if (!otaInfo) {
          res.push([false, downloadErrMsg])
          break
        }
        const firmwareBuf = otaInfo as Uint8Array;
        const sum = calcBufferSum(firmwareBuf);
        const otaRes = await startOTA(firmwareBuf, sum, parseInt(id));
        res.push([otaRes, otaRes ? null : 'otaHooks.firmwareUpgradeFail'])
      }
      let msg = ''
      const hasError = res.some(([status, errMsg]) => {
        if (!status) {
          msg = errMsg!
          return true
        }
      })
      return [hasError, msg];
    } catch (error) {
      window?.$log?.error('Catch error in onlineOta', error);
      return [false, 'otaHooks.firmwareUpgradeFail']
    } finally {
      afterUpgrade()
    }
  }
  const doUpgrade = async () => {
    return onlineOta()
  };
  const afterUpgrade = () => {
    updateFirmwareId.length = 0;
  }
  const localOta = async (unzippedFiles: {
    name: string;
    data: ArrayBuffer;
  }[]) => {
    const res: [boolean, null | string][] = []
    for await (const id of updateFirmwareId) {
      const firmwareName = remoteVersionInfo.value[id]
      const fileInfo = unzippedFiles.find((file) => {
        return firmwareName?.includes(file.name);
      })
      if (fileInfo === undefined) {
        continue
      }
      const firmwareBuf = new Uint8Array(fileInfo.data);
      const sum = calcBufferSum(firmwareBuf);
      const otaRes = await startOTA(firmwareBuf, sum, parseInt(id));
      res.push([otaRes, otaRes ? null : 'otaHooks.firmwareUpgradeFail'])
    }
    let msg = ''

    if (res.length === 0) {
      msg = 'otaHooks.noFirmwareNeedUpgrade';
      otaCtrl.value.status = OtaStatusEnum.UPGRADE_SUCCESS
      otaCtrl.value.progress = 100
      return [true, msg];
    }
    const hasError = res.some(([status, errMsg]) => {
      if (!status) {
        msg = errMsg!
        return true
      }
    }
    )
    if (hasError) {
      return [false, msg]
    }
    return [true, null]
  }
  const fileImport = async (event: Event) => {

    try {
      const input = event.target as HTMLInputElement;
      if (!input.files?.length) return;
      // parse file
      const file = input.files[0];
      if (!['.zip'].some(ext => file.name.toLowerCase().endsWith(ext))) {
        return [false, 'otaHooks.wrongFileType'];
      }
      const zipData = await readFileAsTarget<Blob>(file, (reader => reader.readAsArrayBuffer(file)))
      const unzippedFiles = await unzipFile(zipData);
      const folderName = file.name.substring(0, file.name.length - 4);
      unzippedFiles.forEach((fileInfo) => {
        fileInfo.name = fileInfo.name.split(`${folderName}/`).pop()!
      })
      const manifestFile = unzippedFiles.find(file => file.name.includes('manifest.json'));
      if (!manifestFile) {
        return [false, 'otaHooks.wrongFileFormat'];
      }
      const decoder = new TextDecoder('utf-8');
      const content = decoder.decode(manifestFile.data);
      const manifestData = JSON.parse(content) as VersionInfo;

      remoteVersionInfo.value = Object.assign({}, manifestData,
        {
          isLastVersion: isLastVersion(deviceHd.version, manifestData.version, updateFirmwareId, true),
          journal_cn: manifestData.journal_cn.replace(/\n/g, '<br>'),
        }
      );
      return await localOta(unzippedFiles)
    } catch (error) {
      window.$log?.error('Catch error in fileImport', error);
      return [false, 'otaHooks.firmwareUpgradeFail']
    } finally {
      afterUpgrade()
    }
  };

  const fileExport = async () => {
    const [hasLastVersion, errMsg] = await fetchLastVersion();
    if (!hasLastVersion) {
      return errMsg
    }
    const downloadFileData = async (fileUrl: string) => {
      try {
        const response = await fetch(fileUrl);
        if (!response.ok) {
          return [false, '']
        }
        const blob = await response.blob();
        return [true, blob]

      } catch (error) {
        window?.$log?.error(`download file failed`, fileUrl)
        return [false, '']
      }
    }
    const ids = Object.keys(remoteVersionInfo.value).filter(key => {
      const numKey = parseInt(key)
      return !isNaN(numKey)
    }) as `${number}`[]
    const fileList = []
    for await (const id of ids) {
      const fileName = remoteVersionInfo.value[id]!
      const url = `${baseUrl}/${otaEnv}/${model.value}/${fileName}`;
      const [downloadSuccess, data] = await downloadFileData(url)
      if (!downloadSuccess) {
        break
      }
      fileList.push({
        data: data as Blob,
        name: fileName.split('/').pop() || `${id}.bin`
      })
    }
    const { isLastVersion, ...jsonData } = toRaw(remoteVersionInfo.value)
    fileList.push({
      name: `manifest.json`,
      data: new Blob([JSON.stringify(jsonData)], { type: 'application/json' })
    })
    const exportFileName = `${model.value}-${otaEnv}-v${remoteVersionInfo.value.version}`
    downloadAsZip(fileList, exportFileName)
    return null
  };

  return {
    loading,
    remoteVersionInfo,
    onlineOta,
    versionCheck,
    doUpgrade,
    fileImport,
    fileExport,
    otaCtrl
  };
}
