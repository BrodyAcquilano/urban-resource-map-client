// src/data/locationHelpers.jsx

// ────────────────
// Keys and Labels
// ────────────────

export const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// ────────────────
// Utility Functions
// ────────────────

// Used in: FilterPanel.jsx
export const time24ToMinutes = (timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

// Used in: FilterPanel.jsx
export const timeAMPMToMinutes = (timeStr) => {
  const cleaned = timeStr.trim().toLowerCase();
  const [timePart, period] = cleaned.split(/\s+/);
  if (!timePart || !period) return 0;
  let [hour, minute] = timePart.split(":").map(Number);
  if (period === "p.m." && hour !== 12) hour += 12;
  if (period === "a.m." && hour === 12) hour = 0;
  return hour * 60 + minute;
};

// Used in: FilterPanel.jsx
export const timeOptionsAMPM = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minutes = i % 2 === 0 ? "00" : "30";
  const suffix = hour < 12 ? "a.m." : "p.m.";
  const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${formattedHour}:${minutes} ${suffix}`;
});

