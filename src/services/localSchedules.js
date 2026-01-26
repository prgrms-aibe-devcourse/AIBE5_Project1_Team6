const STORAGE_KEY = "trip_plan_schedules";

export function loadLocalSchedules() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveLocalSchedules(schedules) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
}

export function addLocalSchedule(schedule) {
    const schedules = loadLocalSchedules();
    const newSchedule = {
        id: Date.now().toString(),
        ...schedule,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    schedules.push(newSchedule);
    saveLocalSchedules(schedules);
    return newSchedule;
}

export function updateLocalSchedule(schedule) {
    const schedules = loadLocalSchedules();
    const idx = schedules.findIndex((s) => s.id === schedule.id);
    if (idx === -1) throw new Error("Schedule not found");

    schedules[idx] = {
        ...schedule,
        updatedAt: new Date().toISOString(),
    };
    saveLocalSchedules(schedules);
    return schedules[idx];
}

export function removeLocalSchedule(id) {
    const schedules = loadLocalSchedules();
    const filtered = schedules.filter((s) => s.id !== id);
    saveLocalSchedules(filtered);
    return id;
}

export function clearLocalSchedules() {
    localStorage.removeItem(STORAGE_KEY);
}
