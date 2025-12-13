export interface Invoice {
  id: string;
  client: string;
  requester: string;
  title: string;
  description: string;
  finish_date: string;
  manager: string;
  serial: string;

  remarks?: string;
  work_name?: string;
  amount?: number;
  category?: string;
  media?: string;
  pieces?: number;
  degree?: number;
  work_time?: string;
  adjustment?: number;
  total_amount?: number;
  embedding?: number[];
}