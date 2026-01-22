import fs from "node:fs";
export async function tmpCleanUpFunction() {
  await fs.promises.rm("/tmp/*", { recursive: true });
  return;
}
