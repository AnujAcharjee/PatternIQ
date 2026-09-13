export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { apiHandler, requireAdmin, parseJson } from "@/lib/handler";
import { ok } from "@/lib/api-response";
import { updateProblemSchema } from "@/lib/validations/problem.validation";
import { adminGetProblem, adminUpdateProblem, adminDeleteProblem } from "@/services/problem.service";
import { AuthContext } from "@/lib/auth";

export const GET = apiHandler(async (
  _req, { params, auth }: { params: { id: string }; auth: AuthContext | null }
) => {
  requireAdmin(auth);
  return ok(await adminGetProblem(params.id));
});

export const PATCH = apiHandler(async (
  req: NextRequest, { params, auth }: { params: { id: string }; auth: AuthContext | null }
) => {
  requireAdmin(auth);
  const body = updateProblemSchema.parse(await parseJson(req));
  const problem = await adminUpdateProblem(params.id, body);
  return ok(problem, "Problem updated");
});

export const DELETE = apiHandler(async (
  _req, { params, auth }: { params: { id: string }; auth: AuthContext | null }
) => {
  requireAdmin(auth);
  const result = await adminDeleteProblem(params.id);
  return ok(result);
});
