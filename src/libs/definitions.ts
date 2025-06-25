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
      first_name: string;
      last_name: string;
      salutation: string | null;
      middle_initials: string | null;
      suffix: string | null;
      home_phone: string | null;
      work_phone: string | null;
      mobile_phone: string | null;
      email: string;
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
      };
      seller: {
        last_name: string | null;
        mobile_phone: string | null;
        email: string;
        name: string | null;
      } | null;
      bdc: {
        name: string | null;
        id: number;
        email: string;
        last_name: string | null;
        mobile_phone: string | null;
      } | null;
      finance_manager: {
        name: string | null;
        id: number;
        email: string;
        last_name: string | null;
        mobile_phone: string | null;
      } | null;
      interested_vehicle: {
        vehicle_models: {
          model: string;
        };
        vehicle_brands: {
          brand: string;
        };
        title_license: {
          asking_price: string;
          whole_price: string | null;
          floor_price: string | null;
          buy_now_price: string | null;
        } | null;
        exterior_vehicle_colors: {
          color: string;
        };
        vehicle_mileages: {
          mileage: string;
        } | null;
        vehicle_trim: {
          trim: string;
        } | null;
        vehicle_identification_numbers: {
          vin: string;
        };
        vehicle_manufacture_years: {
          year: string;
        } | null;
      } | null;
    }
  | null
  | undefined;
