import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://dgjpfvpfaginqmkvnvhv.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_ANON_KEY. Set the Supabase publishable/anon key in the Cloudflare Pages build environment.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type ItemStatus = 'available' | 'borrowed';
export type RequestStatus = 'pending' | 'approved' | 'returned';

export interface Item {
  id: string;
  name: string;
  category: string;
  image_url: string;
  status: ItemStatus;
  created_at: string;
}

export interface BorrowRequest {
  id: string;
  item_id: string;
  full_name: string;
  phone: string;
  start_date: string;
  end_date: string;
  status: RequestStatus;
  created_at: string;
}
