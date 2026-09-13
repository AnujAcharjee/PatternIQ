import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";
import { uniqueProblemSlug } from "@/lib/slug";

export async function listPublicProblems(params: {
  difficulty?: string; page: number; limit: number; skip: number;
}) {
  const where: Record<string, unknown> = {};
  if (params.difficulty) where.difficulty = params.difficulty;

  const [items, total] = await Promise.all([
    prisma.problem.findMany({ where, skip: params.skip, take: params.limit, orderBy: { createdAt: "desc" } }),
    prisma.problem.count({ where }),
  ]);
  return { items, total };
}

export async function getProblemById(id: string) {
  const problem = await prisma.problem.findUnique({
    where: { id },
    include: { patterns: { include: { pattern: { select: { id: true, name: true, slug: true } } } } },
  });
  if (!problem) throw ApiError.notFound("Problem not found");
  return problem;
}

// ---- Admin ----

interface ProblemInput {
  title: string;
  platform?: string | null;
  externalId?: string | null;
  solveUrl: string;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
}

export async function adminListProblems() {
  return prisma.problem.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      patterns: {
        include: {
          pattern: {
            select: { id: true, name: true, slug: true },
          },
        },
      },
    },
  });
}

export async function adminGetProblem(id: string) {
  const problem = await prisma.problem.findUnique({ where: { id } });
  if (!problem) throw ApiError.notFound("Problem not found");
  return problem;
}

export async function adminCreateProblem(input: ProblemInput) {
  const slug = await uniqueProblemSlug(input.title);
  return prisma.problem.create({ data: { ...input, slug } });
}

export async function adminUpdateProblem(id: string, input: Partial<ProblemInput>) {
  await adminGetProblem(id);
  const data: Record<string, unknown> = { ...input };
  if (input.title) data.slug = await uniqueProblemSlug(input.title);
  return prisma.problem.update({ where: { id }, data });
}

export async function adminDeleteProblem(id: string) {
  await adminGetProblem(id);
  await prisma.problem.delete({ where: { id } });
  return { message: "Problem deleted" };
}
