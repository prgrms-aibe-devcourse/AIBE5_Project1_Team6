export function simpleDiff(before = "", after = "") {
  const b = before.split("\n");
  const a = after.split("\n");

  const added = a.filter(line => !b.includes(line));
  const removed = b.filter(line => !a.includes(line));

  const lines = [];

  if (removed.length > 0) {
    lines.push("🔴 삭제된 내용:");
    removed.forEach(line => {
      if (line.trim()) lines.push(`  - ${line}`);
    });
    lines.push("");
  }

  if (added.length > 0) {
    lines.push("🟢 추가된 내용:");
    added.forEach(line => {
      if (line.trim()) lines.push(`  + ${line}`);
    });
  }

  if (lines.length === 0) {
    return "변경 사항이 없습니다.";
  }

  return lines.join("\n");
}