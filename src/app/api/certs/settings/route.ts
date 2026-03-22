import checkUserLoginStatus from "@/components/checkUserLoginStatusAPI";
import randomString from "@/components/randomString";
import {
  getRegenSettings,
  saveRegenSettings,
} from "@/components/core/regenSettings";

export const GET = async (req: Request) => {
  const user = await checkUserLoginStatus(req.headers);
  if (!user.loggedIn) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await getRegenSettings();
    return Response.json({
      certUrl: settings.certUrl,
      hasApiKey: settings.apiKey.length > 0,
      error: null,
    });
  } catch (e) {
    const errorId = randomString();
    console.error(`[ERRID: ${errorId}] ${e}`);
    return Response.json(
      {
        certUrl: "",
        hasApiKey: false,
        error: `Internal Server Error, please view server logs for more info. ERRID: ${errorId}`,
      },
      { status: 500 },
    );
  }
};

export const PUT = async (req: Request) => {
  const user = await checkUserLoginStatus(req.headers);
  if (!user.loggedIn) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as { certUrl?: string; apiKey?: string };
    const currentSettings = await getRegenSettings();
    await saveRegenSettings({
      certUrl: body.certUrl?.trim() ?? "",
      apiKey:
        typeof body.apiKey === "string"
          ? body.apiKey.trim()
          : currentSettings.apiKey,
    });
    return Response.json({ ok: true, error: null });
  } catch (e) {
    const errorId = randomString();
    console.error(`[ERRID: ${errorId}] ${e}`);
    return Response.json(
      {
        ok: false,
        error: `Internal Server Error, please view server logs for more info. ERRID: ${errorId}`,
      },
      { status: 500 },
    );
  }
};
