import { exec, spawn } from "node:child_process";
import { promisify } from "node:util";

export const execAsync = promisify(exec);
export const spawnWithInput = (
  cmd: string,
  args: string[],
  input: string,
): Promise<{ stdout: string; stderr: string }> => {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args);
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data: any) => (stdout += data));
    child.stderr.on("data", (data: any) => (stderr += data));

    child.on("close", (code: any) => {
      if (code !== 0) {
        reject(new Error(`Process exited with code ${code}: ${stderr}`));
      } else {
        resolve({ stdout, stderr });
      }
    });

    child.stdin.write(input);
    child.stdin.end();
  });
};
