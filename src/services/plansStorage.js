const KEY = "trip_plans_v1";

export function loadPlans() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}


export function savePlans(plans) {
  localStorage.setItem(KEY, JSON.stringify(plans));
}

export function updatePlan(updated) {
  const plans = loadPlans().map((p) => (p.id === updated.id ? updated : p));
  savePlans(plans);
  return plans;
}

export function addPlan(plan) {
  const plans = loadPlans();
  plans.unshift(plan);
  savePlans(plans);
  return plans;
}

export function removePlan(id) {
  const plans = loadPlans().filter((p) => p.id !== id);
  savePlans(plans);
  return plans;
}

export function clearPlans() {
  localStorage.removeItem(KEY);
}