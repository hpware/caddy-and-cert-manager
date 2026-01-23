import fs from "node:fs";
import { execAsync } from "./exec";
export async function GetAllCurrentCaddySettings() {
  const req = await fetch(`${process.env.CADDY_API_SERVER}/config`);
  const res = await req.json();
  return res;
}

export async function uploadWebHostFilesToServer(
  file: File,
  fileUUID: string = crypto.randomUUID(),
) {
  const tmpFolder = `/tmp/${fileUUID}/`;
  const srvFolder = `/host/${fileUUID}/`;
  await fs.promises.mkdir(tmpFolder, { recursive: true });
  await fs.promises.writeFile(
    `${tmpFolder}archive.zip`,
    Buffer.from(await file.arrayBuffer()),
  );
  await execAsync(`unzip ${tmpFolder}archive.zip -d ${srvFolder}`);
}

export async function AddService() {}
