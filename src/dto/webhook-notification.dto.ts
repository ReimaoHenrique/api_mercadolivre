export class WebhookNotificationDto {
  action: string;
  api_version: string;
  data: {
    id: string;
  };
  date_created: string;
  id: string;
  live_mode: boolean;
  type: string;
  user_id: number;
}

export class WebhookQueryParamsDto {
  'data.id': string;
  type: string;
}

export class PaymentDetailDto {
  id: number;
  date_created: string;
  date_approved?: string;
  date_last_updated: string;
  date_of_expiration?: string;
  money_release_date?: string;
  operation_type: string;
  issuer_id?: string;
  payment_method_id: string;
  payment_type_id: string;
  status: 'pending' | 'approved' | 'authorized' | 'in_process' | 'in_mediation' | 'rejected' | 'cancelled' | 'refunded' | 'charged_back';
  status_detail: string;
  currency_id: string;
  description?: string;
  live_mode: boolean;
  sponsor_id?: number;
  authorization_code?: string;
  money_release_schema?: string;
  taxes_amount: number;
  counter_currency?: string;
  brand_id?: string;
  shipping_amount: number;
  pos_id?: string;
  store_id?: string;
  integrator_id?: string;
  platform_id?: string;
  corporation_id?: string;
  collector_id: number;
  payer: {
    type?: string;
    id?: string;
    email?: string;
    identification?: {
      type?: string;
      number?: string;
    };
    phone?: {
      area_code?: string;
      number?: string;
      extension?: string;
    };
    first_name?: string;
    last_name?: string;
    entity_type?: string;
  };
  metadata: Record<string, any>;
  additional_info?: {
    authentication_code?: string;
    available_balance?: string;
    nsu_processadora?: string;
    ip_address?: string;
  };
  order?: {
    type?: string;
    id?: string;
  };
  external_reference?: string;
  transaction_amount: number;
  transaction_amount_refunded: number;
  coupon_amount: number;
  differential_pricing_id?: number;
  deduction_schema?: string;
  transaction_details: {
    payment_method_reference_id?: string;
    net_received_amount: number;
    total_paid_amount: number;
    overpaid_amount: number;
    external_resource_url?: string;
    installment_amount?: number;
    financial_institution?: string;
    payable_deferral_period?: string;
    acquirer_reference?: string;
  };
  fee_details: Array<{
    type: string;
    amount: number;
    fee_payer: string;
  }>;
  charges_details: Array<{
    id: string;
    name: string;
    type: string;
    accounts: {
      from: string;
      to: string;
    };
    client_id: number;
    date_created: string;
    last_updated: string;
    amounts: {
      original: number;
      refunded: number;
    };
    metadata: Record<string, any>;
    reserve_id?: string;
    refund_charges: Array<any>;
  }>;
  captured: boolean;
  binary_mode: boolean;
  call_for_authorize_id?: string;
  statement_descriptor?: string;
  installments: number;
  card?: {
    id?: string;
    first_six_digits?: string;
    last_four_digits?: string;
    expiration_month?: number;
    expiration_year?: number;
    date_created?: string;
    date_last_updated?: string;
    cardholder?: {
      name?: string;
      identification?: {
        number?: string;
        type?: string;
      };
    };
  };
  notification_url?: string;
  refunds: Array<any>;
  processing_mode: string;
  merchant_account_id?: string;
  merchant_number?: string;
  acquirer_reconciliation: Array<any>;
  point_of_interaction?: {
    type?: string;
    business_info?: {
      unit?: string;
      sub_unit?: string;
    };
  };
}

