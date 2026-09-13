export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { apiHandler, requireAdmin, parseJson } from "@/lib/handler";
import { ok } from "@/lib/api-response";
import { updatePatternSchema } from "@/lib/validations/pattern.validation";
import { adminGetPattern, adminUpdatePattern, adminDeletePattern } from "@/services/pattern.service";
import { AuthContext } from "@/lib/auth";

export const GET = apiHandler(async (
  _req, { params, auth }: { params: { id: string }; auth: AuthContext | null }
) => {
  requireAdmin(auth);
  return ok(await adminGetPattern(params.id));
});

export const PATCH = apiHandler(async (
  req: NextRequest, { params, auth }: { params: { id: string }; auth: AuthContext | null }
) => {
  requireAdmin(auth);
  const body = updatePatternSchema.parse(await parseJson(req));
  const pattern = await adminUpdatePattern(params.id, body);
  return ok(pattern, "Pattern updated");
});

export const DELETE = apiHandler(async (
  _req, { params, auth }: { params: { id: string }; auth: AuthContext | null }
) => {
  requireAdmin(auth);
  const result = await adminDeletePattern(params.id);
  return ok(result);
});
