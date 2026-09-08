import {useEffect, useMemo, useState} from "react";
import {
    fetchMusicState,
    uploadMusic,
    deleteMusic,
    updateMusicSettings,
    type MusicTrack,
    type MusicState
} from "../api/music";

const DEFAULT_API_BASE = `${window.location.protocol}//${window.location.hostname}:4000`;
const API_BASE = (process.env.REACT_APP_API_BASE || DEFAULT_API_BASE).replace(/\/$/, "");

type NewsImage = { id: number; path: string; sort_order: number };
type News = { id: number; title: string; text: string; images: NewsImage[] };

async function api<T>(path: string, init?: RequestInit & { token?: string }): Promise<T> {
    const token = init?.token;
    const headers = new Headers(init?.headers);
    headers.set("Content-Type", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const res = await fetch(`${API_BASE}${path}`, {...init, headers});
    if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
            const data = await res.json();
            msg = data?.error || msg;
        } catch {
            // ignore
        }
        throw new Error(msg);
    }
    return res.json();
}

async function uploadFile(path: string, file: File, token: string): Promise<any> {
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: fd,
    });

    if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
            const data = await res.json();
            msg = data?.error || msg;
        } catch {
            // ignore
        }
        throw new Error(msg);
    }

    return res.json();
}

export function AdminPage() {
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");

    const [token, setToken] = useState<string>(() => localStorage.getItem("admin_token") || "");
    const [error, setError] = useState<string>("");
    const [loading, setLoading] = useState(false);

    const [news, setNews] = useState<News | null>(null);
    const [title, setTitle] = useState("");
    const [text, setText] = useState("");

    const [submitted, setSubmitted] = useState(false);
    const [touchedTitle, setTouchedTitle] = useState(false);
    const [touchedText, setTouchedText] = useState(false);
    const [touchedImages, setTouchedImages] = useState(false);

    const [musicState, setMusicState] = useState<MusicState | null>(null);
    const [musicLoading, setMusicLoading] = useState(false);
    const [musicError, setMusicError] = useState("");

    const authed = Boolean(token);

    useEffect(() => {
        if (!authed) return;
        setLoading(true);
        setError("");
        setSubmitted(false);
        setTouchedTitle(false);
        setTouchedText(false);
        setTouchedImages(false);

        api<{ news: News }>("/api/news/current", {method: "GET", token})
            .then((r) => {
                setNews(r.news);
                setTitle(r.news.title);
                setText(r.news.text);
            })
            .catch((e) => setError(e?.message || String(e)))
            .finally(() => setLoading(false));

        setMusicLoading(true);
        setMusicError("");
        fetchMusicState()
            .then((state) => setMusicState(state))
            .catch((err) => setMusicError(err.message || String(err)))
            .finally(() => setMusicLoading(false));
    }, [authed, token]);

    const images = useMemo(() => news?.images ?? [], [news]);

    const titleError = useMemo(() => {
        if (!authed) return "";
        if (!(submitted || touchedTitle)) return "";
        return title.trim() ? "" : "Заполните заголовок.";
    }, [authed, submitted, title, touchedTitle]);

    const textError = useMemo(() => {
        if (!authed) return "";
        if (!(submitted || touchedText)) return "";
        return text.trim() ? "" : "Заполните текст.";
    }, [authed, submitted, text, touchedText]);

    const imagesError = useMemo(() => {
        if (!authed) return "";
        if (!(submitted || touchedImages)) return "";
        return images.length > 0 ? "" : "Загрузите хотя бы одну картинку.";
    }, [authed, images.length, submitted, touchedImages]);

    const canPublish = useMemo(() => {
        return Boolean(title.trim()) && Boolean(text.trim()) && images.length > 0;
    }, [images.length, text, title]);

    async function onLoginSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const r = await api<{ token: string }>("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({login, password}),
            });
            localStorage.setItem("admin_token", r.token);
            setToken(r.token);
            setPassword("");
        } catch (e: any) {
            setError(e?.message || String(e));
        } finally {
            setLoading(false);
        }
    }

    function logout() {
        localStorage.removeItem("admin_token");
        setToken("");
        setNews(null);
    }

    async function saveNews() {
        if (!token) return;
        setLoading(true);
        setError("");
        try {
            const r = await api<{ news: News }>("/api/news/current", {
                method: "PUT",
                token,
                body: JSON.stringify({title, text}),
            });
            setNews(r.news);
        } catch (e: any) {
            setError(e?.message || String(e));
        } finally {
            setLoading(false);
        }
    }

    async function publishNews() {
        if (!token) return;
        setSubmitted(true);
        if (!canPublish) return;
        setLoading(true);
        setError("");
        try {
            const r = await api<{ published: News; draft: News }>("/api/news/current/publish", {
                method: "POST",
                token,
            });
            setNews(r.draft);
            setTitle(r.draft.title);
            setText(r.draft.text);
            setSubmitted(false);
            setTouchedTitle(false);
            setTouchedText(false);
            setTouchedImages(false);
        } catch (e: any) {
            setError(e?.message || String(e));
        } finally {
            setLoading(false);
        }
    }

    async function addImage(file: File) {
        if (!token) return;
        setLoading(true);
        setError("");
        try {
            await uploadFile("/api/news/current/images", file, token);
            const r = await api<{ news: News }>("/api/news/current", {method: "GET", token});
            setNews(r.news);
            setTouchedImages(true);
        } catch (e: any) {
            setError(e?.message || String(e));
        } finally {
            setLoading(false);
        }
    }

    async function addImages(files: File[]) {
        if (!token) return;
        if (files.length === 0) return;

        setLoading(true);
        setError("");
        try {
            for (const f of files) {
                await uploadFile("/api/news/current/images", f, token);
            }
            const r = await api<{ news: News }>("/api/news/current", {method: "GET", token});
            setNews(r.news);
            setTouchedImages(true);
        } catch (e: any) {
            setError(e?.message || String(e));
        } finally {
            setLoading(false);
        }
    }

    async function deleteImage(id: number) {
        if (!token) return;
        setLoading(true);
        setError("");
        try {
            await api<{ ok: true }>(`/api/news/current/images/${id}`, {method: "DELETE", token});
            const r = await api<{ news: News }>("/api/news/current", {method: "GET", token});
            setNews(r.news);
        } catch (e: any) {
            setError(e?.message || String(e));
        } finally {
            setLoading(false);
        }
    }

    async function handleUploadMusic(files: File[]) {
        if (!token || files.length === 0) return;
        setMusicLoading(true);
        setMusicError("");
        try {
            for (const file of files) {
                await uploadMusic(file, token);
            }
            const state = await fetchMusicState();
            setMusicState(state);
        } catch (err: any) {
            setMusicError(err.message || String(err));
        } finally {
            setMusicLoading(false);
        }
    }

    async function handleDeleteMusic(id: number) {
        if (!token) return;
        setMusicLoading(true);
        setMusicError("");
        try {
            await deleteMusic(id, token);
            const state = await fetchMusicState();
            setMusicState(state);
        } catch (err: any) {
            setMusicError(err.message || String(err));
        } finally {
            setMusicLoading(false);
        }
    }

    async function handleChangeMode(mode: "loop" | "shuffle") {
        if (!token) return;
        setMusicLoading(true);
        setMusicError("");
        try {
            const result = await updateMusicSettings({ mode }, token);
            setMusicState((prev) => prev ? { ...prev, mode: result.mode } : null);
        } catch (err: any) {
            setMusicError(err.message || String(err));
        } finally {
            setMusicLoading(false);
        }
    }

    async function handleChangeRepeat(repeat: boolean) {
        if (!token) return;
        setMusicLoading(true);
        setMusicError("");
        try {
            const result = await updateMusicSettings({ repeat }, token);
            setMusicState((prev) => prev ? { ...prev, repeat: result.repeat } : null);
        } catch (err: any) {
            setMusicError(err.message || String(err));
        } finally {
            setMusicLoading(false);
        }
    }

    return (
        <div
            className="min-h-screen p-6 text-[#e8eefc] [background:radial-gradient(900px_480px_at_30%_10%,rgba(71,120,255,0.24),transparent_70%),radial-gradient(700px_420px_at_70%_40%,rgba(245,197,66,0.16),transparent_65%),radial-gradient(900px_520px_at_40%_95%,rgba(80,200,120,0.12),transparent_60%),#0b1220]">
            <div className="mx-auto grid max-w-[980px] gap-4">
                <header
                    className="flex items-center justify-between rounded-[16px] border border-white/10 bg-white/5 p-4">
                    <h1 className="text-[28px] font-semibold">Администрирование</h1>
                    {authed ? (
                        <button
                            type="button"
                            onClick={logout}
                            className="rounded-[12px] border border-white/10 bg-white/10 px-4 py-2 hover:bg-white/15"
                        >
                            Выйти
                        </button>
                    ) : null}
                </header>

                {error ?
                    <div className="rounded-[14px] border border-red-400/20 bg-red-500/10 p-3">{error}</div> : null}

                {!authed ? (
                    <form
                        onSubmit={onLoginSubmit}
                        className="grid gap-3 rounded-[16px] border border-white/10 bg-white/5 p-4"
                    >
                        <label className="grid gap-1">
                            <span className="text-white/80">Логин</span>
                            <input
                                value={login}
                                onChange={(e) => setLogin(e.target.value)}
                                className="rounded-[12px] border border-white/10 bg-black/20 px-3 py-2"
                            />
                        </label>

                        <label className="grid gap-1">
                            <span className="text-white/80">Пароль</span>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="rounded-[12px] border border-white/10 bg-black/20 px-3 py-2"
                            />
                        </label>

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-1 rounded-[12px] border border-white/10 bg-white/10 px-4 py-2 hover:bg-white/15 disabled:opacity-50"
                        >
                            Войти
                        </button>
                    </form>
                ) : (
                    <section className="grid gap-4 rounded-[16px] border border-white/10 bg-white/5 p-4">
                        <div className="grid gap-2">
                            <h2 className="text-[20px] font-semibold">Новость (текущий слайд)</h2>
                            <label className="grid gap-1">
                                <span className="text-white/80">Заголовок</span>
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    onBlur={() => setTouchedTitle(true)}
                                    className={`rounded-[12px] border bg-black/20 px-3 py-2 ${
                                        titleError ? "border-red-400/60" : "border-white/10"
                                    }`}
                                />
                                {titleError ? <div className="text-[12px] text-red-300">{titleError}</div> : null}
                            </label>

                            <label className="grid gap-1">
                                <span className="text-white/80">Текст</span>
                                <textarea
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    onBlur={() => setTouchedText(true)}
                                    rows={10}
                                    className={`resize-y rounded-[12px] border bg-black/20 px-3 py-2 ${
                                        textError ? "border-red-400/60" : "border-white/10"
                                    }`}
                                />
                                {textError ? <div className="text-[12px] text-red-300">{textError}</div> : null}
                            </label>

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={saveNews}
                                    disabled={loading}
                                    className="rounded-[12px] border border-white/10 bg-emerald-500/20 px-4 py-2 hover:bg-emerald-500/25 disabled:opacity-50"
                                >
                                    Сохранить
                                </button>

                                <button
                                    type="button"
                                    onClick={publishNews}
                                    disabled={loading || !canPublish}
                                    className="rounded-[12px] border border-white/10 bg-white/10 px-4 py-2 hover:bg-white/15 disabled:opacity-50"
                                >
                                    Опубликовать
                                </button>

                                <div className="text-white/60">ID: {news?.id ?? "—"}</div>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <h3 className="text-[18px] font-semibold">Картинки</h3>

                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                disabled={loading}
                                onChange={(e) => {
                                    const list = Array.from(e.target.files ?? []);
                                    if (list.length === 1) addImage(list[0]);
                                    if (list.length > 1) addImages(list);
                                    e.currentTarget.value = "";
                                }}
                            />

                            {imagesError ? <div className="text-[12px] text-red-300">{imagesError}</div> : null}

                            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                                {images.map((img) => (
                                    <div key={img.id}
                                         className="grid gap-2 rounded-[12px] border border-white/10 bg-black/20 p-2">
                                        <img
                                            src={`${API_BASE}${img.path}`}
                                            alt={String(img.id)}
                                            className="h-[140px] w-full rounded-[10px] object-cover"
                                            draggable={false}
                                        />
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="truncate text-[12px] text-white/60">{img.path}</div>
                                            <button
                                                type="button"
                                                onClick={() => deleteImage(img.id)}
                                                className="rounded-[10px] border border-white/10 bg-white/10 px-2 py-1 text-[12px] hover:bg-white/15"
                                            >
                                                Удалить
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                <section className="grid gap-4 rounded-[16px] border border-white/10 bg-white/5 p-4">
                    <h2 className="text-[20px] font-semibold">Музыка</h2>

                    {musicError && <div className="rounded-[14px] border border-red-400/20 bg-red-500/10 p-3">{musicError}</div>}

                    <div className="flex items-center gap-4">
                        <span className="text-white/80">Порядок:</span>
                        <select
                            value={musicState?.mode || "loop"}
                            onChange={(e) => handleChangeMode(e.target.value as "loop" | "shuffle")}
                            disabled={musicLoading}
                            className="rounded-[12px] border border-white/10 bg-black/20 px-3 py-2 disabled:opacity-50"
                        >
                            <option value="loop">По очереди</option>
                            <option value="shuffle">Случайно</option>
                        </select>

                        <label className="flex items-center gap-2 text-white/80">
                            <input
                                type="checkbox"
                                checked={musicState?.repeat ?? true}
                                onChange={(e) => handleChangeRepeat(e.target.checked)}
                                disabled={musicLoading}
                                className="h-4 w-4"
                            />
                            Повторять
                        </label>
                    </div>

                    <div>
                        <input
                            type="file"
                            accept="audio/*"
                            multiple
                            disabled={musicLoading}
                            onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                if (files.length) handleUploadMusic(files);
                                e.currentTarget.value = "";
                            }}
                            className="block w-full text-sm text-white/60 file:mr-4 file:rounded-[12px] file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-white hover:file:bg-white/15"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        {musicState?.tracks.map((track) => (
                            <div key={track.id} className="flex items-center justify-between rounded-[12px] border border-white/10 bg-black/20 p-2">
                                <span className="truncate text-sm">{track.name}</span>
                                <button
                                    onClick={() => handleDeleteMusic(track.id)}
                                    disabled={musicLoading}
                                    className="rounded-[10px] border border-white/10 bg-white/10 px-3 py-1 text-[12px] hover:bg-white/15 disabled:opacity-50"
                                >
                                    Удалить
                                </button>
                            </div>
                        ))}
                    </div>

                    {musicState?.tracks.length === 0 && !musicLoading && (
                        <div className="text-white/50 text-sm">Нет загруженных треков</div>
                    )}
                </section>

                <footer className="text-center text-[12px] text-white/50">
                    API: {API_BASE}
                </footer>
            </div>
        </div>
    );
}
