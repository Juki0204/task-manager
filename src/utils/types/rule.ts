export interface Rule {
  id: string;
  title: string;
  content: string;
  target: string;
  type: string;
  importance: string;
  created_at: string | Date;
  created_by: string;
  updated_at: string | Date;
  updated_by: string;
  confirmation_required_at: string | Date;
}

export interface RuleAcknowledgement {
  id: string;
  rule_id: string;
  user_id: string;
  acknowledged_at: string | Date;
}

export interface RuleHistory {
  id: string;
  rule_id: string;
  action_type: "created" | "updated_major" | "updated_minor";
  acted_by: string;
  acted_at: string | Date;
}