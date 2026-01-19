import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bkzpgtzfsofhxbogtcdw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_37F4sEKibkBiJWcqRHmaZA_953MgYg2';

export interface Database {
  public: {
    Tables: {
      leaderboard: {
        Row: {
          id: number;
          player_name: string;
          score: number;
          level: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          player_name: string;
          score: number;
          level?: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          player_name?: string;
          score?: number;
          level?: string;
          created_at?: string;
        };
      };
    };
  };
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
