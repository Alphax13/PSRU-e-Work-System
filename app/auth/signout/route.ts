import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export async function GET(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const url = new URL(request.url);
  const redirectTo = `${url.origin}/login`;
  return NextResponse.redirect(redirectTo);
}
