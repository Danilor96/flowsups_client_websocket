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

export type Sms = {
  id: number;
  message: string;
  date_sent: Date | null;
  sent_by_user: boolean;
  client_id: number | null;
  status_id: number;
  fileAttachment: Object | null;
  read_by: number[];
  delivered: boolean;
  message_sid: string | null;
  sent: boolean;
  user: {
    id: number;
  }[];
  client_message: {
    seller_id: number | null;
  } | null;
};

export type AppointmentData = {
  id: number;
  created_at: Date;
  status_id: number;
  customer_id: number;
  user_id: number;
  end_date: Date;
  start_date: Date;
  waiting_aprove: boolean | null;
  change_reason: string | null;
  prevented_end_date: Date | null;
  prevented_start_date: Date | null;
  client_accept_appointment: boolean;
  created_by: number;
};

export type TemplateVariablesValues =
  | {
      email: string | null;
      home_phone: string | null;
      mobile_phone: string | null;
      work_phone: string | null;
      first_name: string;
      last_name: string;
      middle_initials: string | null;
      salutation: string | null;
      suffix: string | null;
      client_address: {
        city: string;
        street: string;
        zip: string | null;
        state: {
          state: string;
        };
      };
      lead_source: {
        source: string;
      } | null;
      seller: {
        email: string;
        mobile_phone: string | null;
        last_name: string | null;
        name: string | null;
      } | null;
      bdc: {
        id: number;
        email: string;
        mobile_phone: string | null;
        last_name: string | null;
        name: string | null;
      } | null;
      finance_manager: {
        id: number;
        email: string;
        mobile_phone: string | null;
        last_name: string | null;
        name: string | null;
      } | null;
      interested_vehicle: {
        vehicle_brands: {
          brand: string;
        };
        vehicle_models: {
          model: string;
        };
        title_license: {
          asking_price: string;
          buy_now_price: string | null;
          floor_price: string | null;
          whole_price: string | null;
        } | null;
        exterior_vehicle_colors: {
          color: string;
        } | null;
        vehicle_mileages: {
          mileage: string;
        } | null;
        vehicle_identification_numbers: {
          vin: string;
        };
        vehicle_trim: {
          trim: string;
        } | null;
        vehicle_manufacture_years: {
          year: string;
        } | null;
      } | null;
    }
  | null
  | undefined;

export const enum SMS_STATUS_ID {
  READ = 1,
  UNREAD = 2,
  REPLIED = 3,
  UNREPLIED = 4,
}
