import { supabase } from "./supabase";
import * as local from "./localPlans";

// Supabase <-> App format converter
function toDb(plan) {
  return {
    // id: plan.id, // Supabase generates ID
    title: plan.title,
    subtitle: plan.subtitle,
    hero_image: plan.image || plan.heroImage,
    nights: plan.nights,
    people: plan.people,
    plan_text: plan.planText,
    // lat: plan.lat, 
    category: plan.category || 'walk',

    // Start New Fields
    items: plan.items || [], // Expecting Supabase to have 'items' jsonb
    total_cost: plan.totalCost || 0,
    wellness: plan.wellness || {}, // { noise, light, crowd }
    created_at: plan.createdAt,
    start_date: plan.startDate,
    end_date: plan.endDate
  };
}

function fromDb(row) {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    image: row.hero_image || row.image, // compatibility
    heroImage: row.hero_image,
    nights: row.nights,
    people: row.people,
    planText: row.plan_text,
    category: row.category,
    createdAt: row.created_at,

    // Start New Fields
    items: row.items || [], // JSONB for course items
    totalCost: row.total_cost || 0,
    wellness: row.wellness || {},
    startDate: row.start_date,
    endDate: row.end_date,
  };
}

export async function loadPlans() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load plans:", error);
      return [];
    }
    return data.map(fromDb);
  } else {
    return local.loadLocalPlans();
  }
}

export async function addPlan(plan) {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    const payload = { ...toDb(plan), user_id: session.user.id };
    const { data, error } = await supabase.from("plans").insert(payload).select();
    if (error) {
      console.error(error);
      throw error;
    }
    return fromDb(data[0]);
  } else {
    // 로컬 저장
    return local.addLocalPlan(plan);
  }
}

export async function updatePlan(plan) {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    const payload = toDb(plan);
    const { data, error } = await supabase
      .from("plans")
      .update(payload)
      .eq("id", plan.id)
      .select();

    if (error) throw error;
    return fromDb(data[0]);
  } else {
    return local.updateLocalPlan(plan);
  }
}

export async function removePlan(id) {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    const { error } = await supabase.from("plans").delete().eq("id", id);
    if (error) throw error;
    return id; // just return id
  } else {
    return local.removeLocalPlan(id);
  }
}

export async function clearPlans() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    // maybe don't allow clear all for DB?
    // or delete where user_id = me
    alert("로그인 상태에서는 전체 삭제가 지원되지 않거나 구현되지 않았습니다.");
  } else {
    local.clearLocalPlans();
  }
}