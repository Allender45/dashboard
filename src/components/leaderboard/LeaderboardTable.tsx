export type LeaderboardColumn = {
    key: string;
    label: string;
    align: "left" | "right" | "center";
};

export type LeaderboardRow = Record<string, string> & {
    __rowClass?: string;
};

export function LeaderboardTable(props: {
    title: string;
    period?: string;
    metric?: string;
    columns: LeaderboardColumn[];
    rows: LeaderboardRow[];
    compact?: boolean;
    fontSize?: number;
}) {
    const {title, period, metric, columns, rows, compact, fontSize} = props;

    return (
        <div className="grid min-h-0 grid-rows-[auto_1fr] gap-3">
            <div className="text-[40px] font-semibold">{title}</div>
            <div className="flex items-baseline justify-between gap-3 text-[25px]">
                {metric ? <div>{`Метрика: ${String(metric)}`}</div> : ''}
                {period ? <div>{`Период: ${String(period)}`}</div> : ''}
            </div>

            <div className="overflow-auto rounded-[14px] border border-white/10 bg-black/20">
                <table className={`w-full border-collapse ${compact ? "min-w-[520px]" : "min-w-[860px]"}`}>
                    <thead>
                    <tr>
                        {columns.map((c) => (
                            <th
                                key={String(c.key)}
                                className={`sticky top-0 border-b border-white/10 bg-[rgba(11,18,32,0.88)] p-3 text-[${fontSize? fontSize : 20}px] uppercase tracking-[0.3px] backdrop-blur-[10px] ${
                                    c.align === "right"
                                        ? "w-[17%] text-right tabular-nums"
                                        : c.align === "center"
                                            ? "w-auto text-left"
                                            : "w-[32%] text-left"
                                }`}
                            >
                                {c.label}
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {rows.map((r, idx) => {
                        const rowClass = r.__rowClass ?? "";

                        const leaderRowClass =
                            idx === 0
                                ? "[&>td]:bg-emerald-400/15 [&>td]:font-semibold [&>td:first-child]:shadow-[inset_4px_0_0_rgba(52,211,153,0.9)]"
                                : idx === 1
                                    ? "[&>td]:bg-yellow-300/15 [&>td]:font-semibold [&>td:first-child]:shadow-[inset_4px_0_0_rgba(253,224,71,0.95)]"
                                    : idx === 2
                                        ? "[&>td]:bg-orange-300/15 [&>td]:font-semibold [&>td:first-child]:shadow-[inset_4px_0_0_rgba(253,186,116,0.95)]"
                                        : "";

                        const combinedRowClass = `${rowClass} ${leaderRowClass}`.trim();
                        return (
                            <tr key={`${r[columns[0]?.key ?? "row"] ?? "row"}-${idx}`} className={combinedRowClass}>
                                {columns.map((c) => (
                                    <td
                                        key={String(c.key)}
                                        className={`border-b border-white/10 p-3 text-[${fontSize? fontSize : 20}px] ${
                                            c.align === "right"
                                                ? "w-[17%] text-right tabular-nums"
                                                : c.align === "center"
                                                    ? "w-auto text-left"
                                                    : "w-[32%] text-left"
                                        }`}
                                    >
                                        {String(r[c.key] ?? "")}
                                    </td>
                                ))}
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
