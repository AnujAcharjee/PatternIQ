export const dynamic = "force-dynamic";

import { apiHandler } from "@/lib/handler";
import { ok } from "@/lib/api-response";
import { getPatternBySlug } from "@/services/pattern.service";
import { AuthContext } from "@/lib/auth";

export const GET = apiHandler(async (
  _req, { params, auth }: { params: { slug: string }; auth: AuthContext | null }
) => {
  const pattern = await getPatternBySlug(params.slug, auth?.userId);
  return ok(pattern);
});
