export const env = {
    spreadsheetId: process.env.REACT_APP_SHEETS_SPREADSHEET_ID as string | undefined,
    gid: process.env.REACT_APP_SHEETS_GID as string | undefined,
};

export function requireEnv(name: string, value: string | undefined): string {
    if (!value) throw new Error(`Missing env: ${name}`);
    return value;
}