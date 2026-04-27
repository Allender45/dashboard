export type DepartmentMetricsRow = {
    department: string; // A
    convPhys: string; // B
    leadReturn: string; // C
    convJur: string; // D
    planForecast: string; // E
    points: string; // F
};

export type DepartmentMetricsTable = {
    period: string;
    headers: [string, string, string, string, string, string];
    rows: DepartmentMetricsRow[];
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

function pickFirstNonEmpty(cells: any[]): string {
    for (const cell of cells) {
        const s = cellToString(cell).trim();
        if (s) return s;
    }
    return "";
}

export async function fetchDepartmentMetricsTable(input: {
    spreadsheetId: string;
    gid: string;
}): Promise<DepartmentMetricsTable> {
    // Запрос периода из A1
    const periodUrl = buildGvizUrl({ ...input, range: "A1:A1" });
    const periodRes = await fetch(periodUrl);
    if (!periodRes.ok) {
        throw new Error(`Google Sheets period request failed: HTTP ${periodRes.status}`);
    }
    const periodText = await periodRes.text();
    const periodData = extractGvizJson(periodText);
    const periodRows = periodData?.table?.rows ?? [];
    const periodRow = periodRows[0]?.c ?? [];
    const period = pickFirstNonEmpty(periodRow);

    // Запрос заголовков из A2:G2
    const headersUrl = buildGvizUrl({ ...input, range: "A2:F2" });
    const headersRes = await fetch(headersUrl);
    if (!headersRes.ok) {
        throw new Error(`Google Sheets headers request failed: HTTP ${headersRes.status}`);
    }
    const headersText = await headersRes.text();
    const headersData = extractGvizJson(headersText);
    const headersRows = headersData?.table?.rows ?? [];
    const headerRow = headersRows[0]?.c ?? [];
    const headers = [0, 1, 2, 3, 4, 5].map((i) => cellToString(headerRow[i]).trim()) as DepartmentMetricsTable["headers"];

    // Запрос данных из A3:G11
    const dataUrl = buildGvizUrl({ ...input, range: "A3:F11" });
        const dataRes = await fetch(dataUrl);
    if (!dataRes.ok) {
        throw new Error(`Google Sheets data request failed: HTTP ${dataRes.status}`);
    }
    const dataText = await dataRes.text();
    const data = extractGvizJson(dataText);

    const table = data?.table;
    const rows: any[] = table?.rows ?? [];

    const parsedRows: DepartmentMetricsRow[] = rows
        .map((r) => {
            const c = r?.c ?? [];
            const department = cellToString(c[0]).trim();
            if (!department) return null;
            return {
                department,
                convPhys: cellToString(c[1]),
                leadReturn: cellToString(c[2]),
                convJur: cellToString(c[3]),
                planForecast: cellToString(c[4]),
                points: cellToString(c[5]),
            };
        })
        .filter((x): x is DepartmentMetricsRow => Boolean(x));


    return { period, headers, rows: parsedRows };
}

export async function fetchDepartmentMetricsRows(input: {
    spreadsheetId: string;
    gid: string;
}): Promise<DepartmentMetricsRow[]> {
    const t = await fetchDepartmentMetricsTable(input);
    return t.rows;
}