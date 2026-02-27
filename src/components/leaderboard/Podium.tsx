import type { ReactNode } from "react";

export type PodiumLeader = {
  place: 1 | 2 | 3;
  name: string;
  metric: string;
};

function variantByPlace(place: 1 | 2 | 3): "first" | "second" | "third" {
  if (place === 1) return "first";
  if (place === 2) return "second";
  return "third";
}

function Card(props: { leader: PodiumLeader; highlightWinner?: boolean; baseVariant: "first" | "second" | "third" }) {
  const { leader, highlightWinner, baseVariant } = props;

  const baseHeight = baseVariant === "first" ? "h-full" : baseVariant === "second" ? "h-[82%]" : "h-[70%]";
  const placeTone =
    baseVariant === "first"
      ? "bg-[rgba(245,197,66,0.18)] border-[rgba(245,197,66,0.4)]"
      : baseVariant === "second"
        ? "bg-[rgba(184,193,209,0.18)] border-[rgba(184,193,209,0.4)]"
        : "bg-[rgba(210,139,92,0.18)] border-[rgba(210,139,92,0.4)]";

  const baseBg =
    baseVariant === "first"
      ? "bg-gradient-to-b from-[rgba(245,197,66,0.18)] to-white/10"
      : baseVariant === "second"
        ? "bg-gradient-to-b from-[rgba(184,193,209,0.18)] to-white/10"
        : "bg-gradient-to-b from-[rgba(210,139,92,0.18)] to-white/10";

  return (
    <div className="grid grid-rows-[auto_1fr] gap-2.5 self-end">
      <div
        className={`rounded-[16px] border border-white/10 bg-white/5 p-3.5 shadow-[0_10px_24px_rgba(0,0,0,0.24)] ${
          highlightWinner
            ? "border-[rgba(245,197,66,0.45)] bg-gradient-to-b from-[rgba(245,197,66,0.12)] to-white/10"
            : ""
        }`}
      >
        <div className={`inline-grid h-20 w-20 place-items-center rounded-[10px] border text-[50px] font-bold ${placeTone}`}>
          {leader.place}
        </div>
        <div className="mt-2.5 text-[36px] font-bold leading-[1.2]">{leader.name}</div>
        <div className="mt-1.5 text-[23px] text-white/70">{leader.metric}</div>
      </div>
    </div>
  );
}

export function Podium(props: { leaders: PodiumLeader[]; emptySlot?: ReactNode }) {
  const { leaders } = props;

  const first = leaders.find((x) => x.place === 1);
  const second = leaders.find((x) => x.place === 2);
  const third = leaders.find((x) => x.place === 3);

  const ordered = [second, first, third].filter(Boolean) as PodiumLeader[];

  return (
    <section className="grid h-full grid-cols-[1fr_1.1fr_1fr] items-end gap-3.5 max-[920px]:grid-cols-1" aria-label="Топ 3 лидера">
      {ordered.map((leader) => {
        const variant = variantByPlace(leader.place);
        return <Card key={leader.place} leader={leader} highlightWinner={leader.place === 1} baseVariant={variant} />;
      })}
    </section>
  );
}
