export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { apiHandler, requireAdmin, parseJson } from "@/lib/handler";
import { ok } from "@/lib/api-response";
import { updateTopicSchema } from "@/lib/validations/topic.validation";
import { adminGetTopic, adminUpdateTopic, adminDeleteTopic } from "@/services/topic.service";
import { AuthContext } from "@/lib/auth";

export const GET = apiHandler(async (
  _req, { params, auth }: { params: { id: string }; auth: AuthContext | null }
) => {
  requireAdmin(auth);
  return ok(await adminGetTopic(params.id));
});

export const PATCH = apiHandler(async (
  req: NextRequest, { params, auth }: { params: { id: string }; auth: AuthContext | null }
) => {
  requireAdmin(auth);
  const body = updateTopicSchema.parse(await parseJson(req));
  const topic = await adminUpdateTopic(params.id, body);
  return ok(topic, "Topic updated");
});

export const DELETE = apiHandler(async (
  _req, { params, auth }: { params: { id: string }; auth: AuthContext | null }
) => {
  requireAdmin(auth);
  const result = await adminDeleteTopic(params.id);
  return ok(result);
});
