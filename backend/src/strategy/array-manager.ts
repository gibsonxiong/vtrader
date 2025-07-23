import type { BarData } from 'src/types/common';

export class ArrayManger {
  length: number;
  inited = false;
  count = 0;
  private openArr: number[] = [];
  private closeArr: number[] = [];
  private highArr: number[] = [];
  private lowArr: number[] = [];
  private volumeArr: number[] = [];

  get open(): number[] {
    return this.openArr;
  }

  get close(): number[] {
    return this.closeArr;
  }

  get high(): number[] {
    return this.highArr;
  }

  get low(): number[] {
    return this.lowArr;
  }

  get volume(): number[] {
    return this.volumeArr;
  }

  constructor(len = 50) {
    this.length = len;

    this.openArr = new Array(len).fill(null);
    this.closeArr = new Array(len).fill(null);
    this.highArr = new Array(len).fill(null);
    this.lowArr = new Array(len).fill(null);
    this.volumeArr = new Array(len).fill(null);
  }

  add(bar: BarData) {
    this.openArr.shift();
    this.closeArr.shift();
    this.highArr.shift();
    this.lowArr.shift();
    this.volumeArr.shift();

    this.openArr.push(bar.open);
    this.closeArr.push(bar.close);
    this.highArr.push(bar.high);
    this.lowArr.push(bar.low);
    this.volumeArr.push(bar.volume);

    if (this.count >= this.length) {
      this.inited = true;
    }
    this.count += 1;
  }
}
