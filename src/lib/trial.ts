import { UserAccount, TrialStatus } from '../types';

export const TRIAL_DURATION_DAYS = 30;
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface TrialInfo {
  trialStartDate: number;
  trialEndDate: number;
  trialStartFormatted: string;
  trialEndFormatted: string;
  daysLeft: number;
  status: TrialStatus;
  isPaid: boolean;
  isExpired: boolean;
  isExpiringSoon: boolean;
}

export function formatTrialDate(timestampMs: number): string {
  const date = new Date(timestampMs);
  if (Number.isNaN(date.getTime())) {
    return formatTrialDate(Date.now());
  }
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function createInitialTrialDates(startMs: number = Date.now()): {
  trialStartDate: number;
  trialEndDate: number;
} {
  return {
    trialStartDate: startMs,
    trialEndDate: startMs + TRIAL_DURATION_DAYS * MS_PER_DAY,
  };
}

export function getUserTrialInfo(user: UserAccount, nowMs: number = Date.now()): TrialInfo {
  let startMs = typeof user.trialStartDate === 'number' && user.trialStartDate > 0
    ? user.trialStartDate
    : 0;

  if (!startMs && typeof user.createdAt === 'number' && user.createdAt > 0) {
    startMs = user.createdAt;
  }

  if (!startMs && user.joinedDate) {
    const parsed = Date.parse(user.joinedDate);
    if (!Number.isNaN(parsed) && parsed > 0) {
      startMs = parsed;
    }
  }

  if (!startMs) {
    startMs = nowMs;
  }

  const endMs =
    typeof user.trialEndDate === 'number' && user.trialEndDate > 0
      ? user.trialEndDate
      : startMs + TRIAL_DURATION_DAYS * MS_PER_DAY;

  const isPaid = user.isPaid === true || user.trialStatus === 'Paid';
  const remainingMs = endMs - nowMs;
  const rawDaysLeft = remainingMs <= 0 ? 0 : Math.ceil(remainingMs / MS_PER_DAY);
  const daysLeft = isPaid ? Math.max(0, rawDaysLeft) : Math.max(0, rawDaysLeft);

  let status: TrialStatus;
  if (isPaid) {
    status = 'Paid';
  } else if (user.trialStatus === 'Expired' || daysLeft <= 0) {
    status = 'Expired';
  } else {
    status = 'Free Trial';
  }

  const isExpired = status === 'Expired';
  const isExpiringSoon = status === 'Free Trial' && daysLeft > 0 && daysLeft <= 3;

  return {
    trialStartDate: startMs,
    trialEndDate: endMs,
    trialStartFormatted: formatTrialDate(startMs),
    trialEndFormatted: formatTrialDate(endMs),
    daysLeft: status === 'Expired' ? 0 : daysLeft,
    status,
    isPaid,
    isExpired,
    isExpiringSoon,
  };
}
