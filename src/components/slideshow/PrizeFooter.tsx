import { Prize } from "../leaderboard/Prize";

type PrizeFooterProps = {
  title: string;
  text: string;
};

export function PrizeFooter({ title, text }: PrizeFooterProps) {
  return (
    <div>
      <Prize title={title} text={text} />
    </div>
  );
}
