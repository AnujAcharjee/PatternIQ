export const dynamic = "force-dynamic";

import { apiHandler } from "@/lib/handler";
import { ok } from "@/lib/api-response";
import { getProblemById } from "@/services/problem.service";

export const GET = apiHandler(async (_req, { params }: { params: { id: string } }) => {
  const problem = await getProblemById(params.id);
  return ok(problem);
});
