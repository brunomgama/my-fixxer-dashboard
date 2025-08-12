export interface Setting {
  id: string
  value: string
}

export interface SettingsListResponse {
  lastEvaluatedKey: string
  results: Setting[]
}

export interface UpdateSettingRequest {
  value: string
}

export interface SettingConfig {
  id: string
  label: string
  description: string
  defaultValue: string
  unit?: string
  type: 'number' | 'string'
  min?: number
  max?: number
}

export const SETTINGS_CONFIG: SettingConfig[] = [
  {
    id: 'dailyComplaintRate',
    label: 'Daily Complaint Rate',
    description: 'Max allowed for the daily complaint rate to send emails',
    defaultValue: '0.7',
    type: 'number',
    min: 0,
    max: 1
  },
  {
    id: 'monthComplaintRate',
    label: 'Monthly Complaint Rate',
    description: 'Max allowed for the monthly complaint rate to send emails',
    defaultValue: '0.89',
    type: 'number',
    min: 0,
    max: 1
  },
  {
    id: 'visibilityTime',
    label: 'Visibility Time',
    description: 'How long (in minutes) the user has to wait until we automatically send again if email is not sent due to high complaint rates',
    defaultValue: '1440',
    unit: 'minutes',
    type: 'number',
    min: 1
  },
  {
    id: 'maxBatch',
    label: 'Max Batch Size',
    description: 'Max amount of recipients per batch. If we have more than this amount, emails will be sent in batches',
    defaultValue: '10000',
    unit: 'recipients',
    type: 'number',
    min: 1
  },
  {
    id: 'retryRate',
    label: 'Retry Rate',
    description: 'Amount of time to wait between batches (in minutes)',
    defaultValue: '1440',
    unit: 'minutes',
    type: 'number',
    min: 1
  },
  {
    id: 'maxAllowedAllarms',
    label: 'Max Allowed Alarms',
    description: 'Max amount of alarms to trigger before stopping the campaign',
    defaultValue: '5',
    type: 'number',
    min: 1
  },
  // {
  //   id: 'alarmCount-2025-08-08',
  //   label: 'Alarm Count - 2025-08-08',
  //   description: 'Number of alarms triggered on 2025-08-08',
  //   defaultValue: '0',
  //   type: 'number',
  //   min: 1
  // },
]