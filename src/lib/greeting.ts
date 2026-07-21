const GREETINGS = [
  "Hey vinyl-junkie",
  "Hi groove-seeker",
  "Hello music-lover",
  "Hey record-digger",
  "Hi crate-digger",
  "Hello audiophile",
  "Hey hi-fi aficionado",
  "Hi turntable hero",
  "Hello wax enthusiast",
  "Hey soundtracker",
  "Hi needle-dropper",
  "Hello spin doctor",
] as const;

export function getDailyGreeting(date: Date): string {
  const seed =
    date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  return GREETINGS[seed % GREETINGS.length];
}
