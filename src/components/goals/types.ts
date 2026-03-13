export interface IndividualGoalItem {
  id: string;
  user_id: string;
  goal_id: string;
  cash_goal: number;
  sales_goal: number | null;
  rate_answer: number | null;
  rate_schedule: number | null;
  rate_noshow_max: number | null;
  rate_close: number | null;
  user: {
    id: string;
    name: string;
    role: string;
    avatar_url: string | null;
  };
}
