export function generateDailySlots(
    workingHours: {
        startTime: string;
        endTime: string;
        duration: number;
    },
    date: string
) {
    const slots = [];

    const [startH, startM] = workingHours.startTime.split(":").map(Number);
    const [endH, endM] = workingHours.endTime.split(":").map(Number);

    const duration = workingHours.duration * 60; // duration is in hours, convert to minutes

    let current = startH * 60 + startM;
    const end = endH * 60 + endM;

    while (current + duration <= end) {
        const startTime = `${String(Math.floor(current / 60)).padStart(2, "0")}:${String(current % 60).padStart(2, "0")}`;
        const endTimeRaw = current + duration;
        const endTime = `${String(Math.floor(endTimeRaw / 60)).padStart(2, "0")}:${String(endTimeRaw % 60).padStart(2, "0")}`;

        slots.push({
            startTime,
            endTime,
            date: date
        });

        current += duration;
    }

    return slots;
}