export const dynamic = 'force-dynamic';
import { NextRequest } from "next/server";
import { apiHandler, requireAuth, parseJson } from "@/lib/handler";
import { ok, created } from "@/lib/api-response";
import { createNoteSchema } from "@/lib/validations/note.validation";
import { listNotes, createNote } from "@/services/note.service";
import { AuthContext } from "@/lib/auth";

export const GET = apiHandler(async (req: NextRequest, { auth }: { auth: AuthContext | null }) => {
  const { userId } = requireAuth(auth);
  const { searchParams } = new URL(req.url);
  const patternId = searchParams.get("patternId") || undefined;
  const problemId = searchParams.get("problemId") || undefined;
  const notes = await listNotes(userId, { patternId, problemId });
  return ok(notes);
});

export const POST = apiHandler(async (req: NextRequest, { auth }: { auth: AuthContext | null }) => {
  const { userId } = requireAuth(auth);
  const body = createNoteSchema.parse(await parseJson(req));
  const note = await createNote(userId, body.content, body.patternId, body.problemId);
  return created(note, "Note created");
});

