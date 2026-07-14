const EVENING_GREETINGS = [
  "Hi, Nathalie!",
  "Hola, Nathalie!",
  "Willkommen zurück, Nathalie!",
  "Schön, dich zu sehen, Nathalie!",
];

export const getHomeGreeting = (hour: number, randomIndex: number): string => {
  if (hour >= 5 && hour < 11) return "Guten Morgen, Nathalie ☀️";
  if (hour >= 13 && hour < 18) return "Schönen Nachmittag, Nathalie!";
  return EVENING_GREETINGS[randomIndex % EVENING_GREETINGS.length];
};
