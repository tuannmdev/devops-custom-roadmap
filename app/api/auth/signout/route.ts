import { createServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createServerClient();

  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"));
}
