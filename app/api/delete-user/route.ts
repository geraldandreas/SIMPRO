import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function DELETE(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID tidak ditemukan" }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: dbError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (dbError) {
      console.error("Gagal menghapus profil:", dbError.message);
    }

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      throw authError;
    }

    return NextResponse.json({ message: "Akun berhasil dihapus" }, { status: 200 });

  } catch (error: any) {
    console.error("Error API delete-user:", error.message);
    return NextResponse.json({ error: error.message || "Gagal menghapus akun" }, { status: 500 });
  }
}