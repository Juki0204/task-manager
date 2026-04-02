// /types/task.ts
export interface Task {
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

export interface TaskStatus {
  task_id: string;
  updated_by: string;
  updated_at: Date | string;
}

export interface TaskAcknowledgement {
  task_id: string;
  acknowledged_by: string;
  acknowledged_at: Date | string;
}