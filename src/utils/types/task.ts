// /types/task.ts
export interface Task {
  id: string;
  client: string;
  requester: string;
  title: string;
  description: string;
  requireDate: string;
  finishDate?: string;
  manager?: string;
  status: string;
  priority?: string;
  remarks?: string;
  method: string;
  createdAt: string;
  createdManager: string;
  updatedAt: string;
  updatedManager: string;
  serial: string;
}
