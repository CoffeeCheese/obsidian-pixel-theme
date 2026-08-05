import path from "node:path";

export function pathLeavesDirectory(directory, target) {
  const relative = path.relative(directory, target);
  return (
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  );
}
