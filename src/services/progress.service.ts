import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";

const REVISION_INTERVALS_DAYS = [1, 3, 7, 14, 30];

export async function getProgressOverview(userId: string) {
  const [patternProgress, problemProgress] = await Promise.all([
    prisma.userPatternProgress.findMany({ where: { userId } }),
    prisma.userProblemProgress.findMany({ where: { userId } }),
  ]);

  const totalPatterns = await prisma.pattern.count({ where: { status: "PUBLISHED" } });
  const totalProblems = await prisma.problem.count();

  return {
    totalPatterns,
    completedPatterns: patternProgress.filter((p) => p.status === "COMPLETED" || p.status === "MASTERED").length,
    inProgressPatterns: patternProgress.filter((p) => p.status === "IN_PROGRESS").length,
    totalProblems,
    solvedProblems: problemProgress.filter((p) => p.status === "SOLVED").length,
    problemProgress,
    patternProgress,
  };
}

export async function listPatternProgress(userId: string) {
  return prisma.userPatternProgress.findMany({
    where: { userId },
    include: { pattern: { select: { id: true, name: true, slug: true, topicId: true } } },
  });
}

export async function getPatternProgressDetail(userId: string, patternId: string) {
  const progress = await prisma.userPatternProgress.findUnique({
    where: { userId_patternId: { userId, patternId } },
    include: { pattern: { select: { id: true, name: true, slug: true } } },
  });
  if (!progress) throw ApiError.notFound("No progress found for this pattern yet");
  return progress;
}

export async function startPattern(userId: string, patternId: string) {
  const pattern = await prisma.pattern.findUnique({ where: { id: patternId } });
  if (!pattern) throw ApiError.notFound("Pattern not found");

  const totalProblems = await prisma.patternProblem.count({ where: { patternId } });

  return prisma.userPatternProgress.upsert({
    where: { userId_patternId: { userId, patternId } },
    update: {},
    create: {
      userId, patternId, status: "IN_PROGRESS", startedAt: new Date(), totalProblems,
    },
  });
}

export async function updatePatternStatus(
  userId: string, patternId: string, status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "MASTERED"
) {
  const pattern = await prisma.pattern.findUnique({ where: { id: patternId } });
  if (!pattern) throw ApiError.notFound("Pattern not found");

  const totalProblems = await prisma.patternProblem.count({ where: { patternId } });
  const existing = await prisma.userPatternProgress.findUnique({
    where: { userId_patternId: { userId, patternId } },
  });

  return prisma.userPatternProgress.upsert({
    where: { userId_patternId: { userId, patternId } },
    update: {
      status,
      completedAt: status === "COMPLETED" || status === "MASTERED" ? new Date() : existing?.completedAt,
      startedAt: existing?.startedAt ?? new Date(),
    },
    create: {
      userId,
      patternId,
      status,
      totalProblems,
      startedAt: new Date(),
      completedAt: status === "COMPLETED" || status === "MASTERED" ? new Date() : null,
    },
  });
}

/**
 * Core business logic: markProblemSolved
 * 1. Find/create ProblemProgress
 * 2. Update attempts / solved state
 * 3. Find related patterns
 * 4. Recalculate PatternProgress for each
 * 5. Check pattern completion
 * 6. Schedule Revision on first completion
 * All wrapped in a single transaction so state never becomes inconsistent.
 */
export async function markProblemSolved(userId: string, problemId: string, hintsUsed = 0) {
  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    include: { patterns: { select: { patternId: true } } },
  });
  if (!problem) throw ApiError.notFound("Problem not found");

  return prisma.$transaction(async (tx) => {
    const problemProgress = await tx.userProblemProgress.upsert({
      where: { userId_problemId: { userId, problemId } },
      update: {
        status: "SOLVED",
        attempts: { increment: 1 },
        hintsUsed: { increment: hintsUsed },
        solvedAt: new Date(),
      },
      create: {
        userId, problemId, status: "SOLVED", attempts: 1, hintsUsed, solvedAt: new Date(),
      },
    });

    const updatedPatterns = [];

    for (const { patternId } of problem.patterns) {
      const totalProblems = await tx.patternProblem.count({ where: { patternId } });
      const solvedProblemIds = await tx.userProblemProgress.findMany({
        where: {
          userId, status: "SOLVED",
          problem: { patterns: { some: { patternId } } },
        },
        select: { problemId: true },
      });
      const completedProblems = solvedProblemIds.length;
      const isNowComplete = totalProblems > 0 && completedProblems >= totalProblems;

      const existing = await tx.userPatternProgress.findUnique({
        where: { userId_patternId: { userId, patternId } },
      });
      const wasComplete = existing?.status === "COMPLETED" || existing?.status === "MASTERED";

      const patternProgress = await tx.userPatternProgress.upsert({
        where: { userId_patternId: { userId, patternId } },
        update: {
          completedProblems,
          totalProblems,
          status: isNowComplete ? "COMPLETED" : "IN_PROGRESS",
          completedAt: isNowComplete ? new Date() : existing?.completedAt,
          startedAt: existing?.startedAt ?? new Date(),
        },
        create: {
          userId, patternId, completedProblems, totalProblems,
          status: isNowComplete ? "COMPLETED" : "IN_PROGRESS",
          startedAt: new Date(),
          completedAt: isNowComplete ? new Date() : null,
        },
      });

      // Schedule first revision only the moment the pattern becomes complete
      if (isNowComplete && !wasComplete) {
        const scheduledAt = new Date();
        scheduledAt.setDate(scheduledAt.getDate() + REVISION_INTERVALS_DAYS[0]);

        await tx.revision.create({
          data: { userId, patternId, scheduledAt, status: "PENDING" },
        });

        await tx.userPatternProgress.update({
          where: { id: patternProgress.id },
          data: { nextRevisionAt: scheduledAt },
        });
      }

      updatedPatterns.push(patternProgress);
    }

    return { problemProgress, updatedPatterns };
  });
}

export async function toggleProblemProgress(
  userId: string,
  problemId: string,
  targetStatus?: "SOLVED" | "ATTEMPTED" | "NOT_ATTEMPTED"
) {
  let problem = await prisma.problem.findUnique({
    where: { id: problemId },
    include: { patterns: { select: { patternId: true } } },
  });

  if (!problem) {
    problem = await prisma.problem.findFirst({
      where: { OR: [{ slug: problemId }, { title: problemId }] },
      include: { patterns: { select: { patternId: true } } },
    });
  }

  if (!problem) {
    problem = await prisma.problem.create({
      data: {
        id: problemId,
        title: problemId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        slug: problemId.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        solveUrl: "https://leetcode.com",
        difficulty: "MEDIUM",
      },
      include: { patterns: { select: { patternId: true } } },
    });
  }

  const existing = await prisma.userProblemProgress.findUnique({
    where: { userId_problemId: { userId, problemId: problem.id } },
  });

  let nextStatus: "SOLVED" | "ATTEMPTED" | "NOT_ATTEMPTED";
  if (targetStatus) {
    nextStatus = targetStatus;
  } else {
    nextStatus = existing?.status === "SOLVED" ? "NOT_ATTEMPTED" : "SOLVED";
  }

  if (nextStatus === "SOLVED") {
    return markProblemSolved(userId, problem.id);
  }

  return prisma.$transaction(async (tx) => {
    const updatedProblemProgress = await tx.userProblemProgress.upsert({
      where: { userId_problemId: { userId, problemId: problem.id } },
      update: {
        status: nextStatus,
        solvedAt: null,
      },
      create: {
        userId,
        problemId: problem.id,
        status: nextStatus,
      },
    });

    for (const { patternId } of problem.patterns) {
      const totalProblems = await tx.patternProblem.count({ where: { patternId } });
      const solvedProblemIds = await tx.userProblemProgress.findMany({
        where: {
          userId,
          status: "SOLVED",
          problem: { patterns: { some: { patternId } } },
        },
        select: { problemId: true },
      });
      const completedProblems = solvedProblemIds.length;
      const isNowComplete = totalProblems > 0 && completedProblems >= totalProblems;

      await tx.userPatternProgress.upsert({
        where: { userId_patternId: { userId, patternId } },
        update: {
          completedProblems,
          totalProblems,
          status: isNowComplete ? "COMPLETED" : completedProblems > 0 ? "IN_PROGRESS" : "NOT_STARTED",
        },
        create: {
          userId,
          patternId,
          completedProblems,
          totalProblems,
          status: isNowComplete ? "COMPLETED" : "IN_PROGRESS",
          startedAt: new Date(),
        },
      });
    }

    return { problemProgress: updatedProblemProgress, updatedPatterns: [] };
  });
}

