import { NextResponse, type NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { updateCategorySchema } from "@/lib/categories/schema";
import {
  CategoryInUseError,
  CategoryNameConflictError,
  deleteCategory,
  updateCategory,
} from "@/lib/categories/service";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { response } = await requireRole(["admin"]);
  if (response) return response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid category data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const record = await updateCategory(id, parsed.data);
    if (!record) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    return NextResponse.json({ data: record });
  } catch (error) {
    if (error instanceof CategoryNameConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { response } = await requireRole(["admin"]);
  if (response) return response;

  const { id } = await params;

  try {
    const record = await deleteCategory(id);
    if (!record) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    return NextResponse.json({ data: record });
  } catch (error) {
    if (error instanceof CategoryInUseError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
