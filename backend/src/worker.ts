import { parentPort, Worker } from 'worker_threads';
import * as fs from 'fs';

parentPort?.on('message', (data) => {
  const filename = data.filename;
  
  // 在当前文件夹新建文件，并写入当前时间
  // 执行30秒
  const dt = Date.now();
  while(true) {
    if (Date.now() - dt > 30000) {
      break;
    }
    fs.writeFileSync(filename, `${Date.now()}\n`, { flag: 'a' });
  }
});


