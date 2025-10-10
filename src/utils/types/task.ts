// /types/task.ts
export interface Task {
  id: string;
  client: string;
  requester: string;
  title: string;
  description: string;
  requestDate: string;
  finishDate?: string;
  manager?: string | null;
  status: string;
  priority?: string;
  remarks?: string;
  method: string;
  createdAt: string;
  createdManager: string;
  updatedAt: string;
  updatedManager: string;
  serial: string;
  lockedById: string | null;
  lockedByName: string | null;
  lockedByAt: string | null;
}