import { useEffect, useState } from "react";
import {
    fetchDepartmentMetricsRows,
    fetchDepartmentMetricsTable,
    type DepartmentMetricsRow,
    type DepartmentMetricsTable,
} from "../api/googleSheets";

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

type TableState =
    | { status: "loading" }
    | { status: "error"; error: string }
    | { status: "success"; data: DepartmentMetricsTable };

export function useDepartmentMetricsTable(input: { spreadsheetId: string; gid: string }) {
    const [state, setState] = useState<TableState>({ status: "loading" });

    useEffect(() => {
        let cancelled = false;

        if (!input?.spreadsheetId || !input?.gid) {
            setState({ status: "error", error: "Missing Google Sheets env: spreadsheetId/gid" });
            return () => {
                cancelled = true;
            };
        }

        async function run() {
            try {
                setState({ status: "loading" });
                const data = await fetchDepartmentMetricsTable(input);
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