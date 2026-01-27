import { supabase } from "./supabase";
import * as local from "./localSchedules";

// Supabase <-> App format converter
function toDb(schedule) {
    return {
        title: schedule.title,
        description: schedule.description ?? null,
        start_date: schedule.startDate ?? null,
        end_date: schedule.endDate ?? null,
        people: schedule.people ?? 1,
        schedule_text: schedule.scheduleText ?? null,
        weather_info: schedule.weatherInfo ? schedule.weatherInfo : null,
        mood_data: schedule.moodData ? schedule.moodData : null,
        accommodations: Array.isArray(schedule.accommodations) ? schedule.accommodations : [],
        restaurants: Array.isArray(schedule.restaurants) ? schedule.restaurants : [],
        is_public: !!schedule.isPublic,
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
        moodData: row.mood_data,
        accommodations: row.accommodations ?? [],
        restaurants: row.restaurants ?? [],
        isPublic: row.is_public,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export async function loadSchedules() {
    const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr) throw sessionErr;

    // 로그인: ✅ 내 일정만
    if (session) {
        const { data, error } = await supabase
            .from("schedules")
            .select("*")
            .eq("user_id", session.user.id)   // ✅ 중요
            .order("created_at", { ascending: false });

        if (error) throw error;
        return (data ?? []).map(fromDb);
    }

    // 비로그인: 로컬
    return local.loadLocalSchedules();
}

export async function addSchedule(schedule) {
    const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr) throw sessionErr;

    if (session) {
        const payload = { ...toDb(schedule), user_id: session.user.id };

        const { data, error } = await supabase
            .from("schedules")
            .insert(payload)
            .select()
            .single();

        if (error) throw error;
        return fromDb(data);
    }

    return local.addLocalSchedule(schedule);
}

export async function updateSchedule(schedule) {
    const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr) throw sessionErr;

    if (session) {
        if (!schedule?.id) throw new Error("수정할 일정 id가 없습니다.");

        const payload = toDb(schedule);

        const { data, error } = await supabase
            .from("schedules")
            .update(payload)
            .eq("id", schedule.id)
            .select()
            .single();

        if (error) throw error;
        return fromDb(data);
    }

    return local.updateLocalSchedule(schedule);
}

export async function removeSchedule(id) {
    const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr) throw sessionErr;

    if (session) {
        const { error } = await supabase
            .from("schedules")
            .delete()
            .eq("id", id);

        if (error) throw error;
        return id;
    }

    return local.removeLocalSchedule(id);
}

export async function clearSchedules() {
    const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr) throw sessionErr;

    if (session) {
        // ✅ 로그인 상태에서도 "내 일정 전체 삭제" 가능
        const { error } = await supabase
            .from("schedules")
            .delete()
            .eq("user_id", session.user.id);

        if (error) throw error;
        return true;
    }

    local.clearLocalSchedules();
    return true;
}
