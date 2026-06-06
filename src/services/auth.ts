import { supabase } from '@/lib/supabase';
import { getTelegramUser } from '@/lib/telegram';
import type { User } from '@/types';

/**
 * Upsert the Telegram user into the `users` table and return the record.
 * Called once on app startup after Telegram.WebApp.ready().
 */
export const syncTelegramUser = async (): Promise<User | null> => {
  const tgUser = getTelegramUser();
  if (!tgUser) return null;

  const { data, error } = await supabase
    .from('users')
    .upsert(
      {
        telegram_id: tgUser.id,
        username: tgUser.username ?? null,
        first_name: tgUser.first_name,
        last_name: tgUser.last_name ?? null,
        photo_url: tgUser.photo_url ?? null,
      },
      { onConflict: 'telegram_id' },
    )
    .select()
    .single();

  if (error) {
    console.error('Failed to sync user:', error.message);
    return null;
  }

  return data as User;
};

/** Fetch user by telegram_id */
export const getUserByTelegramId = async (
  telegramId: number,
): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegramId)
    .single();

  if (error) return null;
  return data as User;
};
