import { supabase } from "./supabase";
import * as local from "./localSchedules";

// Supabase <-> App format converter
function toDb(schedule) {
    return {
        title: schedule.title,
        description: schedule.description,
        start_date: schedule.startDate,
        end_date: schedule.endDate,
        people: schedule.people,
        schedule_text: schedule.scheduleText,
        weather_info: schedule.weatherInfo || null,
    };
}

function fromDb(row) {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        startDate: row.start_date,
        endDate: row.end_date,
        people: row.people,
        scheduleText: row.schedule_text,
        weatherInfo: row.weather_info,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export async function loadSchedules() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        const { data, error } = await supabase
            .from("schedules")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Failed to load schedules:", error);
            return [];
        }
        return data.map(fromDb);
    } else {
        return local.loadLocalSchedules();
    }
}

export async function addSchedule(schedule) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        const payload = { ...toDb(schedule), user_id: session.user.id };
        const { data, error } = await supabase.from("schedules").insert(payload).select();
        if (error) {
            console.error(error);
            throw error;
        }
        return fromDb(data[0]);
    } else {
        return local.addLocalSchedule(schedule);
    }
}

export async function updateSchedule(schedule) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        const payload = toDb(schedule);
        const { data, error } = await supabase
            .from("schedules")
            .update(payload)
            .eq("id", schedule.id)
            .select();

        if (error) throw error;
        return fromDb(data[0]);
    } else {
        return local.updateLocalSchedule(schedule);
    }
}

export async function removeSchedule(id) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        const { error } = await supabase.from("schedules").delete().eq("id", id);
        if (error) throw error;
        return id;
    } else {
        return local.removeLocalSchedule(id);
    }
}

export async function clearSchedules() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        alert("로그인 상태에서는 전체 삭제가 지원되지 않습니다.");
    } else {
        local.clearLocalSchedules();
    }
}
