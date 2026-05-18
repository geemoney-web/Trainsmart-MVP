export class RtoResponseDto {
  id: string;
  name: string;
  asqa_code: string;
  operating_states: string[];
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  status_color: string;
  _count: { alerts: number; validations: number };
  superseded_quals_count: number;
  tas_review_count: number;
  trainer_alerts_count: number;
}
