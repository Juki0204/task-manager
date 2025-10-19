export interface User {
  id: string;
  name: string;
  email: string;
  employee: string;
  unread_task_id: string[];
  important_task_id: string[];
}