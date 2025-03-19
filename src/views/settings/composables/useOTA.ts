import { Ref, ref } from 'vue';
import { useMessage } from 'naive-ui';
import { useDeviceOta } from '@/hooks/business/useDeviceOta';
export interface VersionInfo {
  version: number;
  main: string;
  mcu: string;
  desc_cn: string;
  desc_en: string;
}

interface Result {
  list: VersionInfo[];
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
export function useOTA(localVersion: Ref<number>) {
  const baseUrl = 'https://oss-sz-web.oss-cn-shenzhen.aliyuncs.com/ota';
  const model = ref('/RK-S75');
  const otaEnv = '/test';
  const verJson = '/ota.json';
  const loading = ref(false);
  // const showVersion = ref(false);
  // const showProgress = ref(false);
  const progress = ref(0);
  // mtu  从设备读取
  // const mtu = 64;
  const remoteVersionInfo = ref<VersionInfo & { isLastVersion: boolean }>({
    version: 0,
    main: '',
    mcu: '',
    desc_cn: '',
    desc_en: '',
    isLastVersion: false
  });

  const otaCtrl = ref({
    status: OtaStatusEnum.IDLE,
    progress: 0,
    errMsg: ''
  })
  const message = useMessage();

  const handleError = (msg: string) => {
    message.error(msg, { duration: 3000 });
  };

  const startOTA = async (firmware: Uint8Array, fileContentSum: number) => {
    otaCtrl.value.progress = 0;
    // start
    try {
      const fileByteSize = firmware.length;
      otaInstance.setFileContent(firmware);
     const enableSuccess = await otaInstance.enableOtaMode({
        v: remoteVersionInfo.value.version,
        s1: fileContentSum & (0xffff >> 8),
        s2: fileContentSum,
        l1: fileByteSize > BIT_CONDITION ? fileByteSize & (0xff00 >> 8) : fileByteSize >> 8,
        l2: fileByteSize
      });
      if(!enableSuccess){
        throw new Error('Enable ota mode failed')
      }
    } catch (error) {
      window.$log!.error('Catch error in enable ota', error);
      otaCtrl.value.errMsg = '升级失败，请确认设备是否正常'
      otaCtrl.value.status = OtaStatusEnum.UPGRADE_FAIL
    }
    if (otaCtrl.value.status === OtaStatusEnum.UPGRADE_FAIL) {
      return false
    }
    // send
    const transferEnd = await otaInstance.transferContentData({
      onProgress:(process:number)=>{
      otaCtrl.value.progress = process
    }
    });
    if (!transferEnd) {
      otaCtrl.value.status = OtaStatusEnum.UPGRADE_FAIL
      otaCtrl.value.errMsg = '升级失败，请确认设备是否正常'
      window.$log!.error('Catch error in ota transferContentData');
      return false
    }
    // end
    try {
      const upgradeSuccess = await otaInstance.checkOtaStatus();
      if (!upgradeSuccess) {
        otaCtrl.value.errMsg = '升级失败，请确认设备是否正常'
        otaCtrl.value.status = OtaStatusEnum.UPGRADE_FAIL
      }
    } catch (error) {
      window.$log?.error('Catch error in checkOtaStatus', error);
      otaCtrl.value.errMsg = '升级失败，请确认设备是否正常'
      otaCtrl.value.status = OtaStatusEnum.UPGRADE_FAIL
      return false
    }
    otaCtrl.value.status = OtaStatusEnum.UPGRADE_SUCCESS
    otaCtrl.value.errMsg = ''
    return true
  };

  // const fetchFirmware = async (url: string, download: boolean) => {
  //   const fileUrl = `${baseUrl}${otaEnv}${model.value}/${url}`;
  //   const response = await fetch(fileUrl);
  //   if (!response.ok) {
  //     handleError('获取固件失败');
  //     return;
  //   }
  //   isDownload = download;
  //   if (isDownload) {
  //     // 下载固件
  //     const blob = await response.blob();
  //     const downloadUrl = URL.createObjectURL(blob);
  //     const a = document.createElement('a');
  //     a.href = downloadUrl;
  //     a.download = url.split('/').pop() || '';
  //     a.click();
  //     URL.revokeObjectURL(downloadUrl);
  //     handleSuccess('下载成功');
  //   } else {
  //     // 固件升级
  //     const arrayBuffer = await response.arrayBuffer();
  //     const firmware = new Uint8Array(arrayBuffer);

  //     const sum = calcBufferSum(firmware);
  //     return [{ firmware, sum }, null]
  //   }
  // };
  const fetchLastVersion = async () => {
    const url = `${baseUrl}${otaEnv}${model.value}${verJson}`;
    loading.value = true;
    const response = await fetch(url);
    if (!response.ok) {
      return [false, '获取版本信息失败'];
    }
    loading.value = false;
    const data: Result = await response.json();
    if (data.list.length === 0) {
      return [false, '无版本信息'];
    }
    remoteVersionInfo.value = Object.assign({}, data.list[0],
      {
        isLastVersion: data.list[0].version <= localVersion.value
      }
    );
    console.log(remoteVersionInfo.value, remoteVersionInfo.value.isLastVersion, remoteVersionInfo.value.version <= localVersion.value);
    remoteVersionInfo.value.desc_cn = remoteVersionInfo.value.desc_cn.replace(/\n/g, '<br>');
    return [true, null]
  }

  const downLoadFirmwareAsFile = async (fileUrl: string, uriSuffix: string) => {
    let res: [boolean, null | string] = [false, null]
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) {
        res[1] = '获取固件失败'
        return res;
      }
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = uriSuffix.split('/').pop() || '';
      a.click();
      URL.revokeObjectURL(downloadUrl);
      res[0] = true;
    } catch (error) {
      res[1] = '获取固件失败'
      window.$log!.error('Catch error in downLoadFirmwareAsFile', error);
    }
    return res
  }
  const downLoadFirmwareAsUint8 = async (fileUrl: string) => {
    let res: [boolean | Uint8Array, null | string] = [false, null]
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) {
        res[1] = '获取固件失败'
        return res;
      }
      const arrayBuffer = await response.arrayBuffer();
      const firmwareBuf = new Uint8Array(arrayBuffer);

      res[0] = firmwareBuf;
    } catch (error) {
      window?.$log!.error('Catch error in downLoadFirmwareAsUint8', error);
      res[1] = '获取固件失败'
    }
    return res;
  }
  const versionCheck = async () => {
    const [hasLastVersion, errMsg] = await fetchLastVersion();
    if (!hasLastVersion) {
      return [false, errMsg]
    }
    if (remoteVersionInfo.value.isLastVersion) {
      return [false, '当前固件已是最新版本'];
    }
    return [true, null]
  }
  const quickOTAStart = async () => {
    let res:[boolean, null | string]
    const url = `${baseUrl}${otaEnv}${model.value}/${remoteVersionInfo.value.main}`;
    const [otaInfo, downloadErrMsg] = await downLoadFirmwareAsUint8(url)
    if (!otaInfo) {
      res= [false, downloadErrMsg]
      return res;
    }
    const firmwareBuf = otaInfo as Uint8Array;
    const sum = calcBufferSum(firmwareBuf);
    // showProgress.value = true;
    const otaRes = await startOTA(firmwareBuf, sum);
    res= [otaRes, otaRes ? null : '固件升级失败']
    return res;
  }
  // const fetchVersion = async (download: boolean = false) => {
  //   let result = [true, '']
  //   isDownload = download;
  //   if (!isDownload) {
  //     loading.value = true;
  //   }
  //   const url = `${baseUrl}${otaEnv}${model.value}${verJson}`;
  //   const response = await fetch(url);
  //   await delay(1000);
  //   if (!response.ok) {
  //     loading.value = false;
  //     result = [false, '获取版本信息失败'];
  //     return result;
  //   }
  //   loading.value = false;
  //   const data: Result = await response.json();
  //   if (data.list.length === 0) {
  //     handleSuccess('无版本信息');
  //     result = [false, '无版本信息'];
  //     loading.value = false;
  //     return result;
  //   }
  //   remoteVersionInfo.value = data.list[0];
  //   remoteVersionInfo.value.desc_cn = remoteVersionInfo.value.desc_cn.replace(/\n/g, '<br>');
  //   if (isDownload) {
  //     fetchFirmware(remoteVersionInfo.value.main, isDownload);
  //   } else if (remoteVersionInfo.value.version > localVersion.value) {
  //     showVersion.value = true;
  //   } else {
  //     handleSuccess('已经是最新版本');
  //   }
  // };

  const doUpgrade = async () => {
    // showVersion.value = false;
    const url = `${baseUrl}${otaEnv}${model.value}/${remoteVersionInfo.value.main}`;
    const [otaInfo, downloadErrMsg] = await downLoadFirmwareAsUint8(url)
    if (!otaInfo) {
      return [false, downloadErrMsg]
    }
    const firmwareBuf = otaInfo as Uint8Array;
    const sum = calcBufferSum(firmwareBuf);
    // showProgress.value = true;
    const otaRes = await startOTA(firmwareBuf, sum);
    return [otaRes, otaRes ? null : '固件升级失败']
  };

  const fileImport = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const validExtensions = ['.bin', '.ufw'];
      const fileExtension = file.name.slice(-4);
      if (!validExtensions.includes(fileExtension)) {
        handleError('文件类型错误');
        return;
      }
      const reader = new FileReader();
      reader.onload = async e => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const firmware = new Uint8Array(arrayBuffer);
        const sum = calcBufferSum(firmware);
        otaCtrl.value.status = OtaStatusEnum.UPGRADE;
        startOTA(firmware, sum);
      };
      reader.onerror = () => {
        handleError('读取文件失败');
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const fileExport = async () => {
    const [hasLastVersion, errMsg] = await fetchLastVersion();
    if (!hasLastVersion) {
      return errMsg
    }
    const url = `${baseUrl}${otaEnv}${model.value}/${remoteVersionInfo.value.main}`;
    const [downloadStatus, downloadErrMsg] = await downLoadFirmwareAsFile(url, remoteVersionInfo.value.main)
    if (!downloadStatus) {
      return downloadErrMsg
    }
    return null
  };

  return {
    loading,
    // showVersion,
    remoteVersionInfo,
    // showProgress,
    progress,
    // fetchVersion,
    quickOTAStart,
    versionCheck,
    doUpgrade,
    fileImport,
    fileExport,
    otaCtrl
  };
}
