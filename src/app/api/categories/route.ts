import { NextResponse, type NextRequest } from "next/server";
import { requireRole, requireSession } from "@/lib/auth/guard";
import { createCategorySchema } from "@/lib/categories/schema";
import {
  CategoryNameConflictError,
  createCategory,
  listCategories,
} from "@/lib/categories/service";

export async function GET() {
  const { response } = await requireSession();
  if (response) return response;

  const records = await listCategories();
  return NextResponse.json({ data: records });
}

export async function POST(request: NextRequest) {
  const { response } = await requireRole(["admin"]);
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid category data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const record = await createCategory(parsed.data);
    return NextResponse.json({ data: record }, { status: 201 });
  } catch (error) {
    if (error instanceof CategoryNameConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
