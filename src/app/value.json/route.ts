import { buildBaselineValueSnapshot } from "~/lib/scu/value-calculate";

export const runtime = "nodejs";

export const GET = async (): Promise<Response> => {
  const snapshot = buildBaselineValueSnapshot();

  return Response.json(snapshot, {
    headers: {
      "cache-control":
        "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
};
