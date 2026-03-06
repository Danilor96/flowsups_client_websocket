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
  user_id: number | null;
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

export enum TASK_STATUS_ID {
  PENDING = 1,
  COMPLETED = 2,
  CANCELED = 3,
  LATE = 4,
}

export enum NOTIFICATION_TYPE_ID {
  GENERAL = 1,
  APPOINTMENT = 2,
  INVENTORY = 3,
  CUSTOMER = 4,
  WARNING = 5,
}

export enum NOTIFICATION_EVENT_TYPE_ID {
  APPOINTMENTS = 1,
  NOTE_CREATION = 2,
  CUSTOMER_ARRIVAL_DAILY_ACTIVITY = 3,
  TASK_ASSIGNATION = 4,
  CUSTOMER_MARKED_AS_LOST = 5,
  APPOINTMENT_RESCHEDULE_REQUEST = 6,
  CUSTOMER_STATUS_CHANGE = 7,
  APPLICATION_SUBMITTED_BY_A_CUSTOMER = 8,
  CREDIT_APP_COMPLETED = 9,
  DEPOSIT_MADE = 10,
  TEMPERATURE_CHANGE = 11,
  USER_ROLE_CHANGE = 12,
  USER_ACTIVATE_DEACTIVATE = 13,
  APPOINTMENT_ACCEPTED = 14,
  MAX_MISSED_TASKS_COUNTER = 15,
  EXPIRED_APPOINTMENTS = 16,
  DELIVERY_SCHEDULED_REMINDER = 17,
  DELIVERY_SCHEDULED_EXPIRED = 18,
  APPOINTMENT_RESCHEDULE_REMINDER = 19,
  TASK_EXPIRED = 20,
  MISSING_CALL = 21,
  SMS_SENDING_ERROR = 22,
  APPOINTMENT_CANCELATION_REQUEST = 23,
  DELIVERY_SCHEDULE = 24,
  SMS_FROM_CUSTOMER = 25,
  APPOINTMENT_EXPIRED = 26,
  APPOINTMENT_RESCHEDULE = 27,
  LEAD_DUPLICATED = 28,
}
