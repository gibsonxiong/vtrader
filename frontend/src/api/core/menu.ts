import { requestClient } from '#/api/request';

export async function getAllMenusApi() {
  return requestClient.get<any[]>('/menu/all');
}
