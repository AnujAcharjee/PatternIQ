export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { apiHandler } from "@/lib/handler";
import { ok } from "@/lib/api-response";
import { getPageView, incrementPageView } from "@/services/analytics.service";

export const GET = apiHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const page = searchParams.get("page") || "landing";
  const data = await getPageView(page);
  return ok(data);
});

export const POST = apiHandler(async (req: NextRequest, { auth }) => {
  let page = "landing";
  try {
    const body = await req.json();
    if (body?.page && typeof body.page === "string") {
      page = body.page;
    }
  } catch {
    // If request has no JSON body or is empty, default page is "landing"
  }

  // If user is logged in, do not increment view count — return current count
  if (auth) {
    const data = await getPageView(page);
    return ok(data, "User is logged in; view count not incremented");
  }

  const data = await incrementPageView(page);
  return ok(data, "View count incremented");
});
