const COMMANDS = {
  PROGRAM: 0x80,
  ERASE: 0x81,
  VERIFY: 0x82,
  END: 0x83,
  SUCC: 0x84,
  ACTIVE: 0x21 // custom active command
} as const;

// 状态响应类型
type CommandStatus = [number, number, number]; // [head, status_byte1, status_byte2]

export function genActiveCommand(): Uint8Array {
  const buffer = new Uint8Array(64);
  buffer[0] = COMMANDS.ACTIVE; // 命令码
  buffer[1] = 0x0a;
  return buffer;
}
/**
 * 生成擦除指令
 *
 * @param startAddr 起始地址 (32位小端序)
 * @returns 64字节指令包
 */
export function genEraseCommand(startAddr: number): Uint8Array {
  // 地址 (小端序)
  const buffer = new Uint8Array(64);
  // 指令头
  buffer[0] = COMMANDS.ERASE; // 命令码
  buffer[1] = 0x00;
  buffer[2] = startAddr & 0xff;
  buffer[3] = (startAddr >> 8) & 0xff;
  buffer[4] = (startAddr >> 16) & 0xff;
  buffer[5] = (startAddr >> 24) & 0xff;

  return buffer;
}

/**
 * 生成编程指令
 *
 * @param data 数据块 (最大62字节)
 * @returns 64字节指令包
 */
export function genTransferCommand(data: Uint8Array): Uint8Array {
  const buffer = new Uint8Array(64);
  const length = data.length;

  if (length > 62) {
    throw new Error(`编程数据块过大 (${length} > 62 bytes)`);
  }

  // 指令头
  buffer[0] = COMMANDS.PROGRAM; // 命令码
  buffer[1] = length; // 数据长度
  buffer.set(data, 2);
  return buffer;
}

/** 生成编程结束指令 (零长度包) */
export function genTransferEndCommand(): Uint8Array {
  const buffer = new Uint8Array(64);
  buffer[0] = COMMANDS.PROGRAM;
  buffer[1] = 0x00;
  return buffer;
}

/**
 * 生成校验指令
 *
 * @param address 起始地址 (32位小端序)
 * @param data 数据块 (最大56字节)
 * @returns 64字节指令包
 */
export function genVerifyCommand(address: number, data: Uint8Array): Uint8Array {
  const buffer = new Uint8Array(64);
  const length = data.length;

  if (length > 56) {
    throw new Error(`校验数据块过大 (${length} > 56 bytes)`);
  }

  // 指令头
  buffer[0] = COMMANDS.VERIFY; // 命令码
  buffer[1] = length; // 数据长度

  // 地址 (小端序)
  buffer[2] = address & 0xff;
  buffer[3] = (address >> 8) & 0xff;
  buffer[4] = (address >> 16) & 0xff;
  buffer[5] = (address >> 24) & 0xff;
  buffer.set(data, 6);
  return buffer;
}

/** 生成结束指令 */
export function genEndCommand(): Uint8Array {
  const buffer = new Uint8Array(64);
  buffer[0] = COMMANDS.END;
  buffer[1] = 0x00;
  return buffer;
}

/**
 * 验证状态响应
 *
 * @param status 状态响应
 * @returns 是否成功
 */
export function validateStatus(status: CommandStatus): boolean {
  const status1 = status[1];
  const status2 = status[2];
  return status1 === 0x00 && status2 === 0x00;
}
export function validateVerifyStatus(status: CommandStatus): boolean {
  const status1 = status[0];
  const status2 = status[1];
  return status1 === COMMANDS.VERIFY && (status2 === 0x00 || status2 === 0x00);
}
