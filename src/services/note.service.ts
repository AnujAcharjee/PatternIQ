import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";

export interface NoteFilter {
  patternId?: string;
  problemId?: string;
  type?: "pattern" | "problem" | string;
}

export async function listNotes(userId: string, filter?: NoteFilter | string) {
  const whereClause: Record<string, unknown> = { userId };

  if (typeof filter === "string") {
    whereClause.patternId = filter;
    whereClause.problemId = null;
  } else if (filter) {
    if (filter.type === "pattern") {
      whereClause.problemId = null;
      if (filter.patternId) whereClause.patternId = filter.patternId;
    } else if (filter.type === "problem") {
      whereClause.problemId = { not: null };
      if (filter.problemId) whereClause.problemId = filter.problemId;
    } else {
      if (filter.problemId) {
        whereClause.problemId = filter.problemId;
      } else if (filter.patternId) {
        whereClause.patternId = filter.patternId;
        whereClause.problemId = null;
      }
    }
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
      ...(problemId ? { problemId, patternId: null } : patternId ? { patternId } : {}),
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
