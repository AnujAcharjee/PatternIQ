export const dynamic = "force-dynamic";

import { apiHandler } from "@/lib/handler";
import { ok } from "@/lib/api-response";
import { getTopicBySlug } from "@/services/topic.service";

export const GET = apiHandler(async (_req, { params }: { params: { slug: string } }) => {
  const topic = await getTopicBySlug(params.slug);
  return ok(topic);
});
