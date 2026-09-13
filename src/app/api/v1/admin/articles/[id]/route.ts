export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { apiHandler, requireAdmin, parseJson } from "@/lib/handler";
import { ok } from "@/lib/api-response";
import { updateArticleSchema } from "@/lib/validations/article.validation";
import { adminGetArticle, adminUpdateArticle, adminDeleteArticle } from "@/services/article.service";
import { AuthContext } from "@/lib/auth";

export const GET = apiHandler(async (
  _req, { params, auth }: { params: { id: string }; auth: AuthContext | null }
) => {
  requireAdmin(auth);
  return ok(await adminGetArticle(params.id));
});

export const PATCH = apiHandler(async (
  req: NextRequest, { params, auth }: { params: { id: string }; auth: AuthContext | null }
) => {
  requireAdmin(auth);
  const body = updateArticleSchema.parse(await parseJson(req));
  const article = await adminUpdateArticle(params.id, body);
  return ok(article, "Article updated");
});

export const DELETE = apiHandler(async (
  _req, { params, auth }: { params: { id: string }; auth: AuthContext | null }
) => {
  requireAdmin(auth);
  const result = await adminDeleteArticle(params.id);
  return ok(result);
});
