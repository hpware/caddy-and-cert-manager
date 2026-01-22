import { tmpCleanUpFunction } from "@/components/core/system";

export const GET = async () => {
  try {
    await tmpCleanUpFunction();
    return Response.json(
      {
        error: null,
      },
      {
        status: 200,
      },
    );
  } catch (e: any) {
    return Response.json(
      {
        error: e.message,
      },
      {
        status: 500,
      },
    );
  }
};
