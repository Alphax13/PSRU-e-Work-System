import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = session.user;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Allow only images and PDFs
  const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json(
      { error: "อนุญาตเฉพาะไฟล์ภาพ (jpg/png/webp) หรือ PDF เท่านั้น" },
      { status: 400 }
    );
  }

  // Limit 10 MB
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "ไฟล์ต้องมีขนาดไม่เกิน 10 MB" }, { status: 400 });
  }

  const periodId = (formData.get("periodId") as string | null)?.trim() || "unknown-period";
  const sectionNo = (formData.get("sectionNo") as string | null)?.trim() || "0";

  // Sanitize: allow only alphanumeric + hyphen
  const safePeriod = periodId.replace(/[^a-zA-Z0-9\-_]/g, "-");
  const safeSection = sectionNo.replace(/[^0-9]/g, "") || "0";

  const ext = file.type === "image/jpeg" ? "jpg" : (file.name.split(".").pop() ?? "bin");
  const filename = `evaluations/${safePeriod}/section-${safeSection}/${user.id}/${Date.now()}.${ext}`;

  const blob = await put(filename, file, { access: "public" });

  return NextResponse.json({ url: blob.url });
}
