import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { supabase } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  let query = supabase
    .from("communications")
    .select("*, user:user(name, email)")
    .order("sent_at", { ascending: false });

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { userId, subject, content, recipientEmail } = body;

  if (!userId || !subject || !content || !recipientEmail) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    // 1. Send Email via Resend
    await sendEmail({
      to: recipientEmail,
      subject: subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <h2 style="color: #0066ff;">Message from MAPmobile</h2>
          <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #eeeeee;">
            ${content.replace(/\n/g, '<br/>')}
          </div>
          <p style="color: #666666; font-size: 12px; margin-top: 20px;">
            This is an automated message from MAPmobile. Please do not reply directly to this email.
          </p>
        </div>
      `,
    });

    // 2. Save to database
    const { data, error } = await supabase
      .from("communications")
      .insert({
        user_id: userId,
        subject,
        content,
        sender_id: session.user.id,
        status: "sent",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Failed to send communication:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
