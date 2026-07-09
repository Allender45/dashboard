import { useEffect, useState } from "react";

const DAY_NAMES = ["Воскресенье","Понедельник","Вторник","Среда","Четверг","Пятница","Суббота"];

export function FooterClock() {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const t = window.setInterval(() => setNow(new Date()), 1000);
        return () => window.clearInterval(t);
    }, []);

    const time = now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const dayOfWeek = DAY_NAMES[now.getDay()];
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = String(now.getFullYear());
    const date = `${day}.${month}.${year}`;

    return (
        <div className="mx-6 mb-4 flex justify-between items-center px-6 py-[18px] rounded-[16px] border border-white/10 bg-gradient-to-b from-white/10 to-white/5 shadow-[0_12px_28px_rgba(0,0,0,0.35)] text-[#e8eefc] text-[40px] font-medium">
            <span>{time}</span>
            <span>{dayOfWeek}</span>
            <span>{date}</span>
        </div>
    );
}