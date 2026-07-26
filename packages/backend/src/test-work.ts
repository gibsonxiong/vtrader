import { Worker } from 'worker_threads';
import * as path from 'path';

export function testWork(filename: string) {
  const worker = new Worker(path.join(__dirname, 'worker.js'));
  worker.on('message', (result) =>{
      console.log('Received result:', result);
  });
  worker.on('error', (error) => {
    console.error('Worker error:', error);
  });

  worker.postMessage({
    filename,
  }); 
}

// class TaskWorker {
//   isWorking = false;

//   worker: Worker;
  
//   jobId = 0;

//   jobs = new Map<number, (result: any) => void>();

//   constructor(filePath: string) {
//     this.worker = new Worker(filePath);
//     this.worker.on('message', (result) => {
//       const { id, result } = result;
//       this.isWorking = false;

//       this.jobs.get(id)?.(result);
//       this.jobs.delete(id);
//     });
//   }

  
//   async exec(jobName: string, params: any) {
//     this.worker.postMessage({
//       jobName,
//       params,
//       id: this.jobId++,
//     });

//     return new Promise((resolve) => {
//       this.jobs.set(this.jobId, (result) => {
//         resolve(result);
//       });
//     });
//   }
// }


// class WorkerManager {
//   private workers: TaskWorker[] = [];
//   private workerQueue: string[] = [];

//   constructor(private readonly workerCountLimit: number) {
//     this.workers = [];
//     for (let i = 0; i < this.workerCountLimit; i++) {
//       this.createWorker();
//     }
//   }

//   createWorker() {
//     const worker = new TaskWorker(path.join(__dirname, 'worker.js'));
//     this.workers.push(worker);
//   }

//   async exec(jobName: string, params: any) {
//     const worker = this.workers.find((worker) => !worker.isWorking);

//     if (worker) {
//       return await worker.exec(jobName, params);
//     } else {
//       this.workerQueue.push(jobName);
//       return new Promise((resolve) => {
//         this.workerQueue.push(jobName);
//         resolve(null);
//       });
//     }
//   }
// }
