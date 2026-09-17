import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";

export async function listNotes(userId: string, filter?: { patternId?: string; problemId?: string } | string) {
  const whereClause: Record<string, unknown> = { userId };
  if (typeof filter === "string") {
    whereClause.patternId = filter;
  } else if (filter) {
    if (filter.patternId) whereClause.patternId = filter.patternId;
    if (filter.problemId) whereClause.problemId = filter.problemId;
  }

  return prisma.note.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
  });
}

export async function createNote(userId: string, content: string, patternId?: string, problemId?: string) {
  return prisma.note.create({
    data: {
      userId,
      content,
      ...(patternId ? { patternId } : {}),
      ...(problemId ? { problemId } : {}),
    },
  });
}

async function getOwnedNote(userId: string, id: string) {
  const note = await prisma.note.findUnique({ where: { id } });
  if (!note || note.userId !== userId) throw ApiError.notFound("Note not found");
  return note;
}

export async function updateNote(userId: string, id: string, content: string) {
  await getOwnedNote(userId, id);
  return prisma.note.update({ where: { id }, data: { content } });
}

export async function deleteNote(userId: string, id: string) {
  await getOwnedNote(userId, id);
  await prisma.note.delete({ where: { id } });
  return { message: "Note deleted" };
}
