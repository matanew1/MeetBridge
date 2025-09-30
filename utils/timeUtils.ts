export const formatTimeAgo = (
  timestamp: Date,
  translations: {
    now: string;
    minutes: string;
    hours: string;
    yesterday: string;
    days: string;
  }
): string => {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 5) return translations.now;
  if (minutes < 60) return `${minutes} ${translations.minutes}`;
  if (hours < 24) return `${hours} ${translations.hours}`;
  if (days === 1) return translations.yesterday;
  return `${days} ${translations.days}`;
};

export const convertTimestamp = (timestamp: any): Date => {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  if (timestamp?.seconds) {
    return new Date(timestamp.seconds * 1000);
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return new Date(timestamp);
};
