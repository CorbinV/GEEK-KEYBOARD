import { ref } from 'vue';
import { useMessage } from 'naive-ui';
import { OTAEnd, OTAPacket, OTAStart } from '@/api/otaApi';

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
export function useOTA() {
  const baseUrl = 'https://oss-sz-web.oss-cn-shenzhen.aliyuncs.com/ota';
  const model = ref('/RK-S75');
  const otaEnv = '/test';
  const verJson = '/ota.json';
  const loading = ref(false);
  const showVersion = ref(false);
  const showProgress = ref(false);
  const progress = ref(0);
  // mtu  从设备读取
  const mtu = 64;
  // 当前固件版本 从设备读取
  const localVersion = ref(0);
  let isDownload = false;
  const versionInfo = ref<VersionInfo>({
    version: 0,
    main: '',
    mcu: '',
    desc_cn: '',
    desc_en: ''
  });
  const message = useMessage();

  const handleSuccess = (msg: string) => {
    message.success(msg, { duration: 3000 });
  };
  const handleError = (msg: string) => {
    message.error(msg, { duration: 3000 });
  };

  const delay = (ms: number): Promise<void> =>
    new Promise(resolve => {
      setTimeout(resolve, ms);
    });

  const sendFirmwareInChunks = async (firmware: Uint8Array) => {
    const chunkSize = mtu;
    const totalChunks = Math.ceil(firmware.length / chunkSize);
    let currentChunkIndex = 0;

    const chunks = Array.from({ length: totalChunks }, (_, i) => firmware.slice(i * chunkSize, (i + 1) * chunkSize));

    try {
      await chunks.reduce(async (previousPromise, chunk, _) => {
        await previousPromise;
        try {
          await OTAPacket({ data: chunk });
          await delay(1);
          currentChunkIndex += 1;
          const current = Math.round((currentChunkIndex / totalChunks) * 100);
          if (current !== progress.value) {
            progress.value = current;
          }
        } catch (error) {
          console.log('error', error);
        }
      }, Promise.resolve());

      return true;
    } catch (error) {
      console.log('error', error);
      return false;
    }
  };

  const startOTA = async (firmware: Uint8Array) => {
    showProgress.value = true;
    progress.value = 0;

    // start
    try {
      await OTAStart({ ver: 1000, len: firmware.length, sum: 0 });
    } catch (error) {
      console.log('error', error);
      handleError('升级开始失败，请确认设备是否连接');
    }

    // send
    const success = await sendFirmwareInChunks(firmware);
    if (!success) {
      handleError('升级失败，请确认设备是否连接');
      return;
    }

    // end
    try {
      await OTAEnd();
    } catch (error) {
      console.log('error', error);
      handleError('升级结束失败，请确认设备是否连接');
    }
    handleSuccess('升级成功');
  };

  const fetchFirmware = async (url: string, download: boolean) => {
    const fileUrl = `${baseUrl}${otaEnv}${model.value}/${url}`;
    const response = await fetch(fileUrl);
    if (!response.ok) {
      handleError('获取固件失败');
      return;
    }
    isDownload = download;
    if (isDownload) {
      // 下载固件
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = url.split('/').pop() || '';
      a.click();
      URL.revokeObjectURL(downloadUrl);
      handleSuccess('下载成功');
    } else {
      // 固件升级
      const arrayBuffer = await response.arrayBuffer();
      const firmware = new Uint8Array(arrayBuffer);
      startOTA(firmware);
    }
  };

  const fetchVersion = async (download: boolean = false) => {
    isDownload = download;
    if (!isDownload) {
      loading.value = true;
    }
    const url = `${baseUrl}${otaEnv}${model.value}${verJson}`;
    const response = await fetch(url);
    await delay(1000);
    if (!response.ok) {
      handleError('获取版本信息失败');
      loading.value = false;
      return;
    }
    loading.value = false;
    const data: Result = await response.json();
    if (data.list.length === 0) {
      handleSuccess('无版本信息');
      loading.value = false;
      return;
    }
    versionInfo.value = data.list[0];
    versionInfo.value.desc_cn = versionInfo.value.desc_cn.replace(/\n/g, '<br>');
    if (isDownload) {
      fetchFirmware(versionInfo.value.main, isDownload);
    } else if (versionInfo.value.version > localVersion.value) {
      showVersion.value = true;
    } else {
      handleSuccess('已经是最新版本');
    }
  };

  const upgrade = () => {
    showVersion.value = false;
    isDownload = false;
    fetchFirmware(versionInfo.value.main, isDownload);
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
        startOTA(firmware);
      };
      reader.onerror = () => {
        handleError('读取文件失败');
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const fileExport = () => {
    fetchVersion(true);
  };

  return {
    loading,
    showVersion,
    versionInfo,
    showProgress,
    progress,
    fetchVersion,
    upgrade,
    fileImport,
    fileExport
  };
}
