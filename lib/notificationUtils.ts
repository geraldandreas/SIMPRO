import { supabase } from './supabaseClient';

export const sendNotification = async (receiverId: string, title: string, message: string) => {
  const { error } = await supabase
    .from('notifications')
    .insert([
      { 
        user_id: receiverId, 
        title: title, 
        message: message, 
        is_read: false 
      }
    ]);

  if (error) console.error("Gagal kirim notifikasi:", error.message);
};

export const markAllAsRead = async (userId: string) => {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false); 

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Gagal membersihkan notifikasi:", err);
    return false;
  }
};