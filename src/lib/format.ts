export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export const ACTIVITY_LABELS: Record<string, string> = {
  APPLICATION: "Application",
  NETWORKING: "Networking",
  INTERVIEW: "Interview",
  RESEARCH: "Research",
  TRAINING: "Training",
  OTHER: "Other",
};

export const ACTIVITY_COLORS: Record<string, string> = {
  APPLICATION: "bg-blue-100 text-blue-800",
  NETWORKING: "bg-green-100 text-green-800",
  INTERVIEW: "bg-purple-100 text-purple-800",
  RESEARCH: "bg-amber-100 text-amber-800",
  TRAINING: "bg-teal-100 text-teal-800",
  OTHER: "bg-gray-100 text-gray-800",
};
