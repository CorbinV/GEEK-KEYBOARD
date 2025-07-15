import { wch585Cmd } from '@sa/ota';
import requestClient from './config';
export function setEntryBoot() {
  return requestClient.send<never>({
    name: 'entryBoot'
  });
}
export async function setOutBoot() {
  const cmd = wch585Cmd.genEndCommand();

  const data = await requestClient.sendBinary(cmd);
  // @ts-ignore
  return wch585Cmd.validateStatus(data);
}
