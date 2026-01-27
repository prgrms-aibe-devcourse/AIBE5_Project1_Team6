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
        try {
            const { data, error } = await supabase
                .from("schedules")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data.map(fromDb);
        } catch (err) {
            console.error("Failed to load schedules from DB, falling back to local:", err);
            return local.loadLocalSchedules();
        }
    } else {
        return local.loadLocalSchedules();
    }
}

export async function addSchedule(schedule) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        try {
            const payload = { ...toDb(schedule), user_id: session.user.id };
            const { data, error } = await supabase.from("schedules").insert(payload).select();
            if (error) throw error;
            return fromDb(data[0]);
        } catch (err) {
            console.error("Failed to add schedule to DB, falling back to local:", err);
            // Fallback: Add to local storage even if logged in, to prevent data loss
            return local.addLocalSchedule(schedule);
        }
    } else {
        return local.addLocalSchedule(schedule);
    }
}

export async function updateSchedule(schedule) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        try {
            const payload = toDb(schedule);
            const { data, error } = await supabase
                .from("schedules")
                .update(payload)
                .eq("id", schedule.id)
                .select();

            if (error) throw error;
            return fromDb(data[0]);
        } catch (err) {
            console.error("Failed to update schedule in DB, falling back to local:", err);
            return local.updateLocalSchedule(schedule);
        }
    } else {
        return local.updateLocalSchedule(schedule);
    }
}

export async function removeSchedule(id) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        try {
            const { error } = await supabase.from("schedules").delete().eq("id", id);
            if (error) throw error;
            return id;
        } catch (err) {
            console.error("Failed to delete schedule from DB, falling back to local:", err);
            return local.removeLocalSchedule(id);
        }
    } else {
        return local.removeLocalSchedule(id);
    }
}

export async function clearSchedules() {
    // If DB clear is needed, implement here. 
    // Currently fallback to local clear or no-op/alert logic
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        local.clearLocalSchedules();
    } else {
        // Try to clear local just in case we are in fallback mode
        local.clearLocalSchedules();
        // Warn about DB
        // alert("로그인 상태에서는 서버 데이터 전체 삭제가 지원되지 않을 수 있습니다.");
    }
}
