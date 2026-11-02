import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, RotateCcw, Loader2, Clock, XCircle, LockKeyhole, LogOut } from 'lucide-react';
import { supabase, type BorrowRequest, type Item } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface AdminProps {
  refreshKey?: number;
}

interface Row extends BorrowRequest {
  items?: Pick<Item, 'name'>;
}

export default function Admin({ refreshKey = 0 }: AdminProps) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    let active = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
    });

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setError('שגיאה בבדיקת ההתחברות');
      setSession(data.session);
      setAuthLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    const { data: admin, error: authorizationError } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', session.user.id)
      .maybeSingle();
    if (authorizationError || !admin) {
      setRows([]);
      setError(
        authorizationError
          ? 'שגיאה בבדיקת הרשאות מנהל'
          : 'החשבון הזה אינו מורשה למסך הניהול'
      );
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('requests')
      .select('*, items:items(name)')
      .order('created_at', { ascending: false });
    if (error) setError('שגיאה בטעינת הבקשות');
    else setRows((data || []) as Row[]);
    setLoading(false);
  }, [session]);

  useEffect(() => {
    if (session) {
      void load();
    } else {
      setRows([]);
      setLoading(false);
    }
  }, [load, refreshKey, session]);

  const signIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSigningIn(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSigningIn(false);
    if (error) setError('ההתחברות נכשלה. בדקי את כתובת האימייל והסיסמה.');
  };

  const signOut = async () => {
    setError(null);
    const { error } = await supabase.auth.signOut();
    if (error) setError('שגיאה ביציאה מהחשבון');
  };

  const updateRequest = async (id: string, status: 'approved' | 'returned', itemId: string) => {
    setUpdating(id);
    const reqUpdate = supabase.from('requests').update({ status }).eq('id', id);
    const itemStatus = status === 'approved' ? 'borrowed' : 'available';
    const itemUpdate = supabase.from('items').update({ status: itemStatus }).eq('id', itemId);
    const [r, i] = await Promise.all([reqUpdate, itemUpdate]);
    setUpdating(null);
    if (r.error || i.error) {
      setError('שגיאה בעדכון הבקשה');
      return;
    }
    await load();
  };

  const statusBadge = (s: string) => {
    if (s === 'approved')
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-700">
          <CheckCircle2 className="w-3 h-3" /> מושאל
        </span>
      );
    if (s === 'returned')
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-600">
          <RotateCcw className="w-3 h-3" /> הוחזר
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-sky-100 text-sky-700">
        <Clock className="w-3 h-3" /> ממתין
      </span>
    );
  };

  if (authLoading || (session && loading))
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 flex justify-center">
        <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
      </div>
    );

  if (!session)
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 grid place-items-center mb-5">
            <LockKeyhole className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800">כניסה למסך הניהול</h1>
          <p className="text-slate-500 mt-2 mb-6 text-sm">
            יש להתחבר עם חשבון מנהל שהוגדר בפרויקט Supabase.
          </p>

          {error && (
            <div className="mb-4 flex items-center gap-2 text-sm bg-rose-50 text-rose-700 border border-rose-200 rounded-lg px-3 py-2.5">
              <XCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={signIn} className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium text-slate-700 mb-1.5">
                כתובת אימייל
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-slate-700 mb-1.5">
                סיסמה
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <button
              type="submit"
              disabled={signingIn}
              className="w-full h-11 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {signingIn && <Loader2 className="w-4 h-4 animate-spin" />}
              {signingIn ? 'מתחברת...' : 'התחברות'}
            </button>
          </form>
        </div>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            מסך ניהול בקשות
          </h1>
          <p className="text-slate-500 mt-1.5 text-sm sm:text-base">
            אישור השאלות והחזרת פריטים לזמינות.
          </p>
        </div>
        <button
          onClick={signOut}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          <LogOut className="w-4 h-4" />
          יציאה
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 text-sm bg-rose-50 text-rose-700 border border-rose-200 rounded-lg px-3 py-2.5">
          <XCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">עדיין אין בקשות השאלה.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200">
                  <th className="px-4 py-3 font-semibold">פריט</th>
                  <th className="px-4 py-3 font-semibold">שם</th>
                  <th className="px-4 py-3 font-semibold">טלפון</th>
                  <th className="px-4 py-3 font-semibold">התחלה</th>
                  <th className="px-4 py-3 font-semibold">החזרה</th>
                  <th className="px-4 py-3 font-semibold">סטטוס</th>
                  <th className="px-4 py-3 font-semibold">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                      {r.items?.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{r.full_name}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap" dir="ltr">
                      {r.phone}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{r.start_date}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{r.end_date}</td>
                    <td className="px-4 py-3">{statusBadge(r.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          disabled={r.status === 'approved' || updating === r.id}
                          onClick={() => updateRequest(r.id, 'approved', r.item_id)}
                          className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          אושר
                        </button>
                        <button
                          disabled={r.status === 'returned' || updating === r.id}
                          onClick={() => updateRequest(r.id, 'returned', r.item_id)}
                          className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          הוחזר
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
