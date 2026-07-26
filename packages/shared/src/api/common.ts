export interface Response<T = undefined> {
  code: number;
  msg: string;
  data: T;
}
