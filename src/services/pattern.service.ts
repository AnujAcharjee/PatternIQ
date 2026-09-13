import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";
import { uniquePatternSlug, uniqueTopicSlug } from "@/lib/slug";

const patternListSelect = {
  id: true, slug: true, name: true, number: true, difficulty: true,
  importance: true, shortDescription: true, topicId: true,
  timeComplexity: true, spaceComplexity: true,
  topic: { select: { id: true, name: true, slug: true } },
  _count: { select: { problems: true } },
};

export async function listPublicPatterns(params: {
  topicSlug?: string; difficulty?: string; page: number; limit: number; skip: number;
}) {
  const where: Record<string, unknown> = { status: "PUBLISHED" };
  if (params.topicSlug) where.topic = { slug: params.topicSlug };
  if (params.difficulty) where.difficulty = params.difficulty;

  const [items, total] = await Promise.all([
    prisma.pattern.findMany({
      where, select: patternListSelect, orderBy: [{ topicId: "asc" }, { number: "asc" }, { order: "asc" }],
      skip: params.skip, take: params.limit,
    }),
    prisma.pattern.count({ where }),
  ]);
  return { items, total };
}

export async function getPatternBySlug(slug: string, userId?: string) {
  const pattern = await prisma.pattern.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      topic: { select: { id: true, name: true, slug: true } },
      useCases: { orderBy: { order: "asc" } },
      warnings: { orderBy: { order: "asc" } },
      problems: {
        orderBy: { order: "asc" },
        include: { problem: true },
      },
    },
  });
  if (!pattern) throw ApiError.notFound("Pattern not found");

  let userProgress = null;
  if (userId) {
    userProgress = await prisma.userPatternProgress.findUnique({
      where: { userId_patternId: { userId, patternId: pattern.id } },
    });
  }

  return { ...pattern, userProgress };
}

// ---- Admin ----

export async function resolveOrCreateTopic(topicId?: string, topicName?: string): Promise<string> {
  if (topicId && topicId.trim()) {
    const existingById = await prisma.topic.findUnique({ where: { id: topicId.trim() } });
    if (existingById) return existingById.id;
  }

  const rawName = (topicName || topicId || "").trim();
  if (!rawName) {
    throw ApiError.badRequest("Curriculum Topic / Track is required");
  }

  // Check if topic exists by name (case-insensitive)
  const existingByName = await prisma.topic.findFirst({
    where: {
      name: { equals: rawName, mode: "insensitive" },
    },
  });

  if (existingByName) {
    return existingByName.id;
  }

  // Create new topic in the database
  const slug = await uniqueTopicSlug(rawName);
  const maxOrder = await prisma.topic.aggregate({ _max: { order: true } });
  const newTopic = await prisma.topic.create({
    data: {
      name: rawName,
      slug,
      order: (maxOrder._max.order ?? 0) + 1,
      published: true,
      icon: "Target",
    },
  });

  return newTopic.id;
}

interface PatternInput {
  topicId?: string;
  topicName?: string;
  number: number;
  name: string;
  shortDescription?: string | null;
  whatIsThis?: string | null;
  intuition?: string | null;
  identificationSignals?: string | null;
  executionRecipe?: string | null;
  coreIdea?: string | null;
  interviewRule?: string | null;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  importance?: number;
  timeComplexity?: string | null;
  spaceComplexity?: string | null;
  pseudocode?: string | null;
  cppTemplate?: string | null;
  javaTemplate?: string | null;
  jsTemplate?: string | null;
  pyTemplate?: string | null;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  benchmarkProblemIds?: string[];
  useCases?: string[];
  whenNotToUse?: string[];
  warnings?: string[];
}

export async function adminListPatterns() {
  return prisma.pattern.findMany({
    orderBy: [{ topicId: "asc" }, { number: "asc" }, { order: "asc" }],
    include: {
      topic: { select: { id: true, name: true, slug: true } },
      problems: { include: { problem: true } },
      _count: { select: { problems: true } },
    },
  });
}

export async function adminGetPattern(id: string) {
  const pattern = await prisma.pattern.findUnique({
    where: { id },
    include: {
      topic: { select: { id: true, name: true, slug: true } },
      useCases: true,
      warnings: true,
      problems: { include: { problem: true } },
      _count: { select: { problems: true } },
    },
  });
  if (!pattern) throw ApiError.notFound("Pattern not found");
  return pattern;
}

export async function adminCreatePattern(input: PatternInput) {
  const resolvedTopicId = await resolveOrCreateTopic(input.topicId, input.topicName);
  const slug = await uniquePatternSlug(input.name);
  const { useCases, whenNotToUse, warnings, benchmarkProblemIds, topicId, topicName, ...rest } = input;

  const createdPattern = await prisma.pattern.create({
    data: {
      ...rest,
      topicId: resolvedTopicId,
      status: input.status || "PUBLISHED",
      slug,
      useCases: {
        create: [
          ...(useCases || []).map((c, i) => ({ content: c, order: i, isWhenNotToUse: false })),
          ...(whenNotToUse || []).map((c, i) => ({ content: c, order: i, isWhenNotToUse: true })),
        ],
      },
      warnings: { create: (warnings || []).map((c, i) => ({ content: c, order: i })) },
    },
    include: { useCases: true, warnings: true },
  });

  if (Array.isArray(benchmarkProblemIds) && benchmarkProblemIds.length > 0) {
    await prisma.patternProblem.createMany({
      data: benchmarkProblemIds.map((probId, idx) => ({
        patternId: createdPattern.id,
        problemId: probId,
        order: idx,
        isCore: true,
      })),
      skipDuplicates: true,
    });
  }

  return adminGetPattern(createdPattern.id);
}

export async function adminUpdatePattern(id: string, input: Partial<PatternInput>) {
  const existing = await adminGetPattern(id);
  const { useCases, whenNotToUse, warnings, benchmarkProblemIds, name, topicId, topicName, ...rest } = input;
  const data: Record<string, unknown> = { ...rest };
  if (name && name !== existing.name) {
    data.name = name;
    data.slug = await uniquePatternSlug(name);
  }

  if (topicId !== undefined || topicName !== undefined) {
    data.topicId = await resolveOrCreateTopic(topicId, topicName);
  }

  if (useCases || whenNotToUse) {
    await prisma.patternUseCase.deleteMany({ where: { patternId: id } });
    data.useCases = {
      create: [
        ...(useCases || []).map((c, i) => ({ content: c, order: i, isWhenNotToUse: false })),
        ...(whenNotToUse || []).map((c, i) => ({ content: c, order: i, isWhenNotToUse: true })),
      ],
    };
  }
  if (warnings) {
    await prisma.patternWarning.deleteMany({ where: { patternId: id } });
    data.warnings = { create: warnings.map((c, i) => ({ content: c, order: i })) };
  }

  if (Array.isArray(benchmarkProblemIds)) {
    await prisma.patternProblem.deleteMany({ where: { patternId: id } });
    if (benchmarkProblemIds.length > 0) {
      await prisma.patternProblem.createMany({
        data: benchmarkProblemIds.map((probId, idx) => ({
          patternId: id,
          problemId: probId,
          order: idx,
          isCore: true,
        })),
        skipDuplicates: true,
      });
    }
  }

  await prisma.pattern.update({ where: { id }, data });
  return adminGetPattern(id);
}

export async function adminDeletePattern(id: string) {
  await adminGetPattern(id);
  await prisma.pattern.delete({ where: { id } });
  return { message: "Pattern deleted" };
}

export async function adminDuplicatePattern(id: string) {
  const original = await adminGetPattern(id);
  const slug = await uniquePatternSlug(`${original.name}-copy`);

  return prisma.pattern.create({
    data: {
      topicId: original.topicId,
      number: original.number,
      name: `${original.name} (Copy)`,
      slug,
      shortDescription: original.shortDescription,
      whatIsThis: original.whatIsThis,
      intuition: original.intuition,
      coreIdea: original.coreIdea,
      interviewRule: original.interviewRule,
      difficulty: original.difficulty,
      importance: original.importance,
      timeComplexity: original.timeComplexity,
      spaceComplexity: original.spaceComplexity,
      pseudocode: original.pseudocode,
      cppTemplate: original.cppTemplate,
      javaTemplate: original.javaTemplate,
      jsTemplate: original.jsTemplate,
      status: "DRAFT",
      useCases: {
        create: original.useCases.map((u) => ({
          content: u.content, order: u.order, isWhenNotToUse: u.isWhenNotToUse,
        })),
      },
      warnings: { create: original.warnings.map((w) => ({ content: w.content, order: w.order })) },
    },
  });
}

export async function adminReorderPatterns(items: { id: string; order: number }[]) {
  await prisma.$transaction(
    items.map((item) => prisma.pattern.update({ where: { id: item.id }, data: { order: item.order } }))
  );
  return { message: "Patterns reordered" };
}

export async function adminSetPatternStatus(id: string, status: "DRAFT" | "PUBLISHED" | "ARCHIVED") {
  await adminGetPattern(id);
  return prisma.pattern.update({ where: { id }, data: { status } });
}

// ---- Pattern <-> Problem attachment ----

export async function attachProblemToPattern(
  patternId: string, problemId: string, isCore = true, order = 0
) {
  await adminGetPattern(patternId);
  const problem = await prisma.problem.findUnique({ where: { id: problemId } });
  if (!problem) throw ApiError.notFound("Problem not found");

  const existing = await prisma.patternProblem.findUnique({
    where: { patternId_problemId: { patternId, problemId } },
  });
  if (existing) throw ApiError.conflict("Problem is already attached to this pattern");

  return prisma.patternProblem.create({ data: { patternId, problemId, isCore, order } });
}

export async function detachProblemFromPattern(patternId: string, problemId: string) {
  const link = await prisma.patternProblem.findUnique({
    where: { patternId_problemId: { patternId, problemId } },
  });
  if (!link) throw ApiError.notFound("This problem is not attached to the pattern");
  await prisma.patternProblem.delete({ where: { id: link.id } });
  return { message: "Problem detached from pattern" };
}

export async function reorderPatternProblems(
  patternId: string, items: { problemId: string; order: number }[]
) {
  await prisma.$transaction(
    items.map((item) =>
      prisma.patternProblem.update({
        where: { patternId_problemId: { patternId, problemId: item.problemId } },
        data: { order: item.order },
      })
    )
  );
  return { message: "Pattern problems reordered" };
}
