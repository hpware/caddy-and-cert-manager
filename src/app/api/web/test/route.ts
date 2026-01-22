import { GetAllCurrentCaddySettings } from "@/components/core/caddyControl";

export const GET = async () => {
  const settings = await GetAllCurrentCaddySettings();
  return new Response(JSON.stringify(settings), { status: 200 });
};
