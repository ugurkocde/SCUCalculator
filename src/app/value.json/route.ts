import { buildValueSnapshot } from "~/lib/scu/value-aggregator";

export const runtime = "nodejs";
export const revalidate = 300;

export const GET = async (): Promise<Response> => {
  const snapshot = await buildValueSnapshot();

  return Response.json(snapshot, {
    headers: {
      "cache-control":
        "public, max-age=300, s-maxage=300, stale-while-revalidate=600",
    },
  });
};
