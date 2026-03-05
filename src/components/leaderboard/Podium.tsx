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

function Card(props: { leader: PodiumLeader; baseVariant: "first" | "second" | "third" }) {
  const { leader, baseVariant } = props;

  const placeTone =
    baseVariant === "first"
      ? "bg-[rgba(245,197,66,0.18)] border-[rgba(245,197,66,0.4)]"
      : baseVariant === "second"
        ? "bg-[rgba(184,193,209,0.18)] border-[rgba(184,193,209,0.4)]"
        : "bg-[rgba(210,139,92,0.18)] border-[rgba(210,139,92,0.4)]";

  return (
    <div className="grid h-full grid-rows-[auto_1fr] gap-2.5">
      <div
        className={`flex h-full flex-col rounded-[16px]`}
      >
        <div className={`inline-grid h-20 w-20 place-items-center rounded-[10px] border text-[50px] font-bold ${placeTone}`}>
          {leader.place}
        </div>
        <div className="mt-2.5">
          <div className="whitespace-pre-line text-[36px] font-bold leading-[1.2]">{leader.name}</div>
          <div className="mt-1.5 text-[23px] text-white/70">{leader.metric}</div>
        </div>
      </div>
    </div>
  );
}

export function Podium(props: { leaders: PodiumLeader[]; emptySlot?: ReactNode }) {
  const { leaders } = props;

  function collapseSamePlace(place: 1 | 2 | 3): PodiumLeader | null {
    const bucket = leaders.filter((x) => x.place === place);
    if (bucket.length === 0) return null;
    const name = bucket.map((x) => x.name).filter(Boolean).join("\n");
    return {
      place,
      name,
      metric: bucket[0]!.metric,
    };
  }

  const first = collapseSamePlace(1);
  const second = collapseSamePlace(2);
  const third = collapseSamePlace(3);

  const ordered = [second, first, third].filter(Boolean) as PodiumLeader[];

  return (
    <section className="grid grid-cols-[1fr_1.1fr_1fr] items-stretch gap-3.5 max-[920px]:grid-cols-1" aria-label="Топ 3 лидера">
      {ordered.map((leader) => {
        const variant = variantByPlace(leader.place);
        return <Card key={leader.place} leader={leader} baseVariant={variant} />;
      })}
    </section>
  );
}
