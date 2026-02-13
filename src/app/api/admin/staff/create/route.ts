import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/auth-schema";

export async function POST(req: Request) {
  try {
    const { email, full_name, role, map_id, password, dob, age, address, phone } = await req.json();

    // Generate a unique 4-digit access code
    const access_code = Math.floor(1000 + Math.random() * 9000).toString();

    // Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create the user in Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role,
        map_id,
        dob,
        age,
        address,
        phone,
        access_code
      }
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authUser.user) {
      return NextResponse.json({ error: "User creation failed" }, { status: 500 });
    }

    // Create the profile in the profiles table
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: authUser.user.id,
        email,
        full_name,
        role,
        map_id,
        access_code,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      // If profile creation fails, we should probably delete the auth user to maintain consistency
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json({ error: `Profile creation failed: ${profileError.message}` }, { status: 500 });
    }

    // Also create in better-auth user table for consistency and session management
    try {
      const nameParts = full_name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      await db.insert(userTable).values({
        id: authUser.user.id,
        name: full_name,
        email,
        emailVerified: true,
        role: role,
        firstName,
        lastName,
        phone,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (dbError: any) {
      console.error("Failed to create better-auth user record:", dbError);
      // We don't fail the whole request if this fails, as profiles table is the primary source for admin dashboard
      // but it might cause issues with login. However, profiles table is already updated.
    }

    return NextResponse.json({ success: true, user: authUser.user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
