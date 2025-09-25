import { Task } from "../types/task";

export interface dbTaskProps {
  id: string;
  client: string;
  requester: string;
  title: string;
  description: string;
  request_date: string;
  finish_date: string | null;
  manager: string | null;
  status: string;
  priority: string | null;
  remarks: string | null;
  method: string;
  created_at: string;
  created_manager: string;
  updated_at: string;
  updated_manager: string;
  serial: string;
  locked_by_id: string | null;
  locked_by_name: string | null;
  locked_by_at: string | null;
}

export function mapDbTaskToTask(dbTask: dbTaskProps): Task {
  return {
    id: dbTask.id,
    client: dbTask.client,
    requester: dbTask.requester,
    title: dbTask.title,
    description: dbTask.description,
    requestDate: dbTask.request_date,
    finishDate: dbTask.finish_date ? dbTask.finish_date : "",
    manager: dbTask.manager ? dbTask.manager : "",
    status: dbTask.status,
    priority: dbTask.priority ? dbTask.priority : "",
    remarks: dbTask.remarks ? dbTask.remarks : "",
    method: dbTask.method,
    createdAt: dbTask.created_at,
    createdManager: dbTask.created_manager,
    updatedAt: dbTask.updated_at,
    updatedManager: dbTask.updated_manager,
    serial: dbTask.serial,
    lockedById: dbTask.locked_by_id,
    lockedByName: dbTask.locked_by_name,
    lockedByAt: dbTask.locked_by_at,
  };
}