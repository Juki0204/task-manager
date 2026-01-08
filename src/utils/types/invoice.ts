export interface Invoice {
  id: string;
  client: string;
  requester: string;
  title: string;
  description: string;
  finish_date: string;
  manager: string;
  serial: string;

  remarks?: string | null;
  work_name?: string | null;
  amount?: number | null;
  category?: string | null;
  media?: string | null;
  pieces?: number | null;
  degree?: number | null;
  work_time?: string | null;
  adjustment?: number | null;
  total_amount?: number | null;
  embedding?: number[];
}