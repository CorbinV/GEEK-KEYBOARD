import JSZip from "jszip";
export async function downloadAsZip(files: {
  data: Blob
  name: string
}[], zipName: string) {
  const zip = new JSZip();

  for (const file of files) {
    const content = await file.data;
    zip.file(file.name, content);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });

  const link = document.createElement("a");
  const downloadUrl = URL.createObjectURL(zipBlob);
  link.href = downloadUrl;
  link.download = `${zipName}.zip`;
  link.click();
  URL.revokeObjectURL(downloadUrl);
}
export async function unzipFile(zipData: Blob) {
  const zip = new JSZip();
  const unzippedFiles: { name: string; data: ArrayBuffer }[] = [];
  const zipContent = await zip.loadAsync(zipData);
  for (const fileName in zipContent.files) {
    const file = zipContent.files[fileName];
    if (!file.dir) {
      const fileData = await file.async("arraybuffer");
      unzippedFiles.push({ name: fileName, data: fileData });
    }
  }
  return unzippedFiles;
}
export async function readFileAsTarget<T>(file: File, cb: (reader: FileReader, data: File) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as T);
    reader.onerror = reject;
    cb(reader, file)
  });
}
