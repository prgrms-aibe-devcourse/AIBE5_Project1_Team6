export function simpleDiff(before = "", after = "") {
  const b = before.split("\n");
  const a = after.split("\n");

  const added = a.filter(line => !b.includes(line));
  const removed = b.filter(line => !a.includes(line));

  return { added, removed };
}