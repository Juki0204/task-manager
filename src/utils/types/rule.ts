export interface Rule {
  id: string;
  title: string;
  content: string;
  target: string;
  type: string;
  importance: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  confirmation_required_at: string;
}

export interface RuleAcknowledgement {
  id: string;
  rule_id: string;
  user_id: string;
  acknowledged_at: string;
}