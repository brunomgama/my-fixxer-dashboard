export interface EmailEvent {
    event_type?: string;
    send_time?: string;
    message_id?: string;
    source_email?: string;
    header_subject?: string;
    header_from?: string;
    header_to?: string;
    source_arn?: string;
    sendingaccountid?: string;
    from_domain?: string;
    utm_campaign_id?: string;
    template_id?: string;
    environment?: string;
    locale?: string;
    homeowner_id?: string;
    pro_id?: string;
    utm_source?: string;
    request_id?: string;
    invoice_id?: string;
    claim_id?: string;
    intervention_id?: string;
    admin_id?: string;
    client_id?: string;
    from?: string;
    to?: string;
    subject?: string;
    delivery_time?: string;
  }
  
  export type EmailEventList = EmailEvent[];
  