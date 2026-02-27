export type DepartmentMetricsRow = {
    department: string; // A
    convPhys: string; // B
    leadReturn: string; // C
    convJur: string; // D
    totalDefectPct: string; // E
    planForecast: string; // F
    points: string; // G
};

function buildGvizUrl(params: {
    spreadsheetId: string;
    gid: string;
    tq?: string;
    range?: string;
}): string {
    const { spreadsheetId, gid, tq, range } = params;

    const base = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(
        spreadsheetId
    )}/gviz/tq?gid=${encodeURIComponent(gid)}&tqx=out:json`;

    const queryParts: string[] = [];
    if (range) queryParts.push(`range=${encodeURIComponent(range)}`);
    if (tq) queryParts.push(`tq=${encodeURIComponent(tq)}`);

    if (queryParts.length === 0) return base;
    return `${base}&${queryParts.join("&")}`;
}

function extractGvizJson(text: string): any {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
        throw new Error("Failed to parse gviz response (JSON not found).");
    }
    return JSON.parse(text.slice(start, end + 1));
}

function cellToString(cell: any): string {
    if (!cell) return "";
    if (cell.f != null) return String(cell.f);
    if (cell.v == null) return "";
    return String(cell.v);
}

export async function fetchDepartmentMetricsRows(input: {
    spreadsheetId: string;
    gid: string;
}): Promise<DepartmentMetricsRow[]> {
    const url = buildGvizUrl({ ...input, range: "A21:G29" });

    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Google Sheets request failed: HTTP ${res.status}`);
    }

    const text = await res.text();
    const data = extractGvizJson(text);

    const table = data?.table;
    const rows: any[] = table?.rows ?? [];

    return rows.map((r) => {
        const c = r?.c ?? [];
        return {
            department: cellToString(c[0]),
            convPhys: cellToString(c[1]),
            leadReturn: cellToString(c[2]),
            convJur: cellToString(c[3]),
            totalDefectPct: cellToString(c[4]),
            planForecast: cellToString(c[5]),
            points: cellToString(c[6]),
        };
    });
}