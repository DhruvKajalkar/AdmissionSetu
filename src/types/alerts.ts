export type AlertPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type AlertStatus = "ACTIVE" | "SNOOZED" | "COMPLETED" | "DISMISSED";

export type AlertType =
  | "SEAT_OFFER"
  | "OFFER_EXPIRY"
  | "ROUND_START"
  | "ROUND_POSITION_CHANGE"
  | "VACANCY_CHANGE"
  | "PREFERENCE_WARNING"
  | "DOCUMENT_MISSING"
  | "DOCUMENT_READY"
  | "SCHOLARSHIP_MATCH"
  | "SCHOLARSHIP_DEADLINE"
  | "ADMISSION_CONFIRMED"
  | "SEAT_RELEASED"
  | "SYSTEM_INFO";

export type AlertSource =
  | "Admission state"
  | "Merit clearing"
  | "Preference safety"
  | "Document Passport"
  | "Scholarship Navigator";

export type AlertSection = "NEEDS_ACTION" | "COMING_UP" | "COMPLETED";

export type AlertSnoozeOption = "IN_ONE_HOUR" | "TOMORROW_MORNING" | "LATER";

export interface AlertItem {
  id: string;
  candidateId: string;
  type: AlertType;
  priority: AlertPriority;
  status: AlertStatus;
  section: AlertSection;
  title: string;
  message: string;
  source: AlertSource;
  createdAt: string;
  dueAt?: string;
  actionLabel?: string;
  actionHref?: string;
  relatedEntityId?: string;
  resolvedAt?: string;
  actionable: boolean;
  dismissible: boolean;
  snoozedUntil?: string;
}

export interface AlertControlState {
  version: 1;
  snoozedUntilByAlertId: Record<string, string>;
  dismissedAlertIds: string[];
}

export interface AlertSummary {
  actionableCount: number;
  needsActionCount: number;
  comingUpCount: number;
  completedCount: number;
}
