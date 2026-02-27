import { useEffect, useState } from "react";
import { fetchDepartmentMetricsRows, type DepartmentMetricsRow } from "../api/googleSheets";

type State =
    | { status: "loading" }
    | { status: "error"; error: string }
    | { status: "success"; data: DepartmentMetricsRow[] };

export function useSheetTable(input: { spreadsheetId: string; gid: string }) {
    const [state, setState] = useState<State>({ status: "loading" });

    useEffect(() => {
        let cancelled = false;

        async function run() {
            try {
                setState({ status: "loading" });
                const data = await fetchDepartmentMetricsRows(input);
                if (!cancelled) setState({ status: "success", data });
            } catch (e) {
                if (!cancelled) {
                    setState({
                        status: "error",
                        error: e instanceof Error ? e.message : String(e),
                    });
                }
            }
        }

        run();
        return () => {
            cancelled = true;
        };
    }, [input.spreadsheetId, input.gid]);

    return state;
}