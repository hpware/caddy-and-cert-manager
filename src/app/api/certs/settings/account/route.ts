import checkUserLoginStatus from "@/components/checkUserLoginStatusAPI";
import { fetchRegenAccount } from "@/components/core/regenClient";
import randomString from "@/components/randomString";

export const GET = async (req: Request) => {
  const user = await checkUserLoginStatus(req.headers);
  if (!user.loggedIn) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const account = await fetchRegenAccount();
    return Response.json({
      account,
      error: null,
    });
  } catch (e) {
    const errorId = randomString();
    console.error(`[ERRID: ${errorId}]`, e);
    return Response.json(
      {
        account: null,
        error: `Internal Server Error. See ERRID: ${errorId}`,
      },
      { status: 500 },
    );
  }
};
