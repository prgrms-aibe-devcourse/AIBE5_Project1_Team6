const KEY = "trip_plans_v1";

export function loadLocalPlans() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalPlans(plans) {
  localStorage.setItem(KEY, JSON.stringify(plans));
}

export function addLocalPlan(plan) {
  const plans = loadLocalPlans();
  plans.unshift(plan);
  saveLocalPlans(plans);
  return plans;
}

export function updateLocalPlan(updated) {
  const plans = loadLocalPlans().map((p) => (p.id === updated.id ? updated : p));
  saveLocalPlans(plans);
  return plans;
}

export function removeLocalPlan(id) {
  const plans = loadLocalPlans().filter((p) => p.id !== id);
  saveLocalPlans(plans);
  return plans;
}

export function clearLocalPlans() {
  localStorage.removeItem(KEY);
}
