// src/util/generateDailySlots.ts
export function generateDailySlots(
    workingHours: {
        startTime: string;
        endTime: string;
        duration: number;
        workingDays: string[];
    }, 
    date: string // date parameter add করুন
) {
    const slots = [];

    const [startH, startM] = workingHours.startTime.split(":").map(Number);
    const [endH, endM] = workingHours.endTime.split(":").map(Number);

    const duration = workingHours.duration;

    let current = startH * 60 + startM;
    const end = endH * 60 + endM;

    while (current + duration <= end) {
        const startTime = `${String(Math.floor(current / 60)).padStart(2, "0")}:${String(current % 60).padStart(2, "0")}`;
        const endTimeRaw = current + duration;
        const endTime = `${String(Math.floor(endTimeRaw / 60)).padStart(2, "0")}:${String(endTimeRaw % 60).padStart(2, "0")}`;
        
        slots.push({ 
            startTime, 
            endTime,
            date: date // requested date use করুন
        });

        current += duration;
    }

    return slots;
}