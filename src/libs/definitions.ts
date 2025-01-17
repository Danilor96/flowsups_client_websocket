export type Tasks = {
  id: number;
  title: string;
  description: string;
  assigned_to: number | null;
  customer_id: number | null;
  created_by: number;
  created_at: Date;
  status: number;
  deadline: Date;
  updated_at: Date | null;
  finished_at: Date | null;
  manager_task: boolean | null;
  completed_by: number | null;
  assigned_to_all_managers: boolean | null;
  appointment_id: number | null;
  customer: {
    id: number;
    first_name: string;
    last_name: string;
    mobile_phone: string;
    email: string;
    client_status_id: number | null;
    lead_temperature_id: number | null;
  } | null;
  assigned: {
    name: string | null;
    last_name: string | null;
  } | null;
  task_status: {
    status: string;
  };
};
