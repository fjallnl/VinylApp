import { getDailyGreeting } from "@/lib/greeting";

export default function Greeting() {
  const greeting = getDailyGreeting(new Date());
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold tracking-widest uppercase">{greeting}</h1>
      <p className="text-dim text-xs uppercase tracking-widest font-light mt-1">
        Your vinyl dashboard
      </p>
    </div>
  );
}
