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
    prizePlaces?: number;
    rowLeaders?: boolean;
}) {
    const {title, period, metric, columns, rows, compact, fontSize, prizePlaces, rowLeaders} = props;

    const columnLeaders: Record<string, string> = {};
    if (rowLeaders) {
        for (const col of columns) {
            const isDefect = col.label.toLowerCase().includes("брак");
            let bestVal: number | null = null;
            let bestStr = "";
            for (const row of rows) {
                const raw = String(row[col.key] ?? "");
                const num = parseFloat(raw.replace(/[^\d.,-]/g, "").replace(",", "."));
                if (!isNaN(num) && (bestVal === null || (isDefect ? num < bestVal : num > bestVal))) {
                    bestVal = num;
                    bestStr = raw;
                }
            }
            if (bestVal !== null) columnLeaders[col.key] = bestStr;
        }
    }

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
                        {columns.map((c, colIdx) => (
                            <th
                                key={String(c.key)}
                                style={{ fontSize: fontSize ?? 20 }}
                                className={`sticky top-0 border-b border-white/10 bg-[rgba(11,18,32,0.88)] p-3 uppercase tracking-[0.3px] backdrop-blur-[10px] ${
                                    colIdx === 0
                                        ? "w-[32%] text-left"
                                        : colIdx === columns.length - 1
                                            ? "w-[17%] text-right tabular-nums"
                                            : "w-auto text-center"
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

                        let leaderRowClass = ''

                        if (prizePlaces === 1) {
                            leaderRowClass =
                                idx === 0
                                    ? "[&>td]:bg-emerald-400/15 [&>td]:font-semibold [&>td:first-child]:shadow-[inset_4px_0_0_rgba(52,211,153,0.9)]"
                                    : "";
                        } else {
                            leaderRowClass =
                                idx === 0
                                    ? "[&>td]:bg-emerald-400/15 [&>td]:font-semibold [&>td:first-child]:shadow-[inset_4px_0_0_rgba(52,211,153,0.9)]"
                                    : idx === 1
                                        ? "[&>td]:bg-yellow-300/15 [&>td]:font-semibold [&>td:first-child]:shadow-[inset_4px_0_0_rgba(253,224,71,0.95)]"
                                        : idx === 2
                                            ? "[&>td]:bg-orange-300/15 [&>td]:font-semibold [&>td:first-child]:shadow-[inset_4px_0_0_rgba(253,186,116,0.95)]"
                                            : "";
                        }



                        const combinedRowClass = `${rowClass} ${leaderRowClass}`.trim();
                        return (
                            <tr key={`${r[columns[0]?.key ?? "row"] ?? "row"}-${idx}`} className={combinedRowClass}>
                                {columns.map((c, colIdx) => (
                                    <td
                                        key={String(c.key)}
                                        className={`border-b border-white/10 p-3 ${
                                            colIdx === 0
                                                ? "w-[32%] text-left"
                                                : colIdx === columns.length - 1
                                                    ? "w-[17%] text-right tabular-nums"
                                                    : "w-auto text-center"
                                        }`}
                                        style={{ fontSize: fontSize ?? 20, ...(rowLeaders && colIdx !== 0 && colIdx !== columns.length - 1 && columnLeaders[c.key] !== undefined && String(r[c.key] ?? "") === columnLeaders[c.key] ? {backgroundImage: "linear-gradient(rgba(234,179,8,0.9), rgba(234,179,8,0.9))", backgroundSize: "70% 3px", backgroundPosition: "center bottom", backgroundRepeat: "no-repeat"} : {}) }}
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
