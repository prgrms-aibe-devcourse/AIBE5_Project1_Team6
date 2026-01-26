import { supabase } from "./supabase";
import * as local from "./localPlans";

// Supabase <-> App format converter
function toDb(plan) {
  return {
    // id: plan.id, // Supabase generates ID
    title: plan.title,
    subtitle: plan.subtitle,
    image: plan.image || plan.heroImage, // check usages
    nights: plan.nights,
    people: plan.people,
    plan_text: plan.planText,
    lat: plan.lat,
    lon: plan.lon,
    // Start New Fields
    type: plan.type || 'single',
    items: plan.items || [], // Expecting Supabase to have 'items' jsonb or text
    total_cost: plan.totalCost || 0,
    // created_at: plan.createdAt
  };
}

function fromDb(row) {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    image: row.image,
    heroImage: row.image, // compatibility
    nights: row.nights,
    people: row.people,
    planText: row.plan_text,
    lat: row.lat,
    lon: row.lon,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // Start New Fields
    type: row.type || 'single', // course | single
    items: row.items || [], // JSONB for course items
    totalCost: row.total_cost || 0,
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