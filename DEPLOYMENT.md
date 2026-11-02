# פריסה והגדרת Supabase

## Supabase

1. בפרויקט `dgjpfvpfaginqmkvnvhv`, פתחי את **SQL Editor**.
2. אם הטבלאות `items` ו־`requests` עדיין לא קיימות, הריצי קודם את [מיגרציית הסכמה](./supabase/migrations/20261018123522_gemach_schema.sql).
3. הריצי מיד אחריה את [מיגרציית ההרשאות](./supabase/migrations/20261102153000_secure_request_access.sql). היא מאפשרת לציבור לראות פריטים ולשלוח בקשות, אך רק למנהלים מורשים לראות בקשות או לשנות נתונים.
4. תחת **Authentication → Users**, צרי משתמש מנהל. לאחר מכן כבי הרשמה ציבורית בהגדרות Authentication.
5. מצאי את מזהה המשתמש (UUID) והריצי ב־SQL Editor:

   ```sql
   INSERT INTO public.admin_users (user_id)
   VALUES ('<AUTH_USER_UUID>');
   ```

   רק משתמש שמופיע בטבלה `admin_users` יוכל לנהל את האתר.

## Cloudflare Pages

בהגדרות ה־build של הפרויקט הגדירי:

- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Build environment variable:** `VITE_SUPABASE_ANON_KEY` עם מפתח ה־publishable/anon של פרויקט Supabase.

כתובת הפרויקט מוגדרת כברירת מחדל בקוד. אפשר להגדיר גם `VITE_SUPABASE_URL` ב־Cloudflare כדי לדרוס אותה. לעולם אל תשתמשי במפתח `service_role` באתר או במשתני `VITE_`; המפתח הזה מיועד לשרת בלבד.

אחרי שמירת המשתנה ב־Cloudflare, הפעילי build ופריסה מחדש כדי שהערך ייכלל בקובצי האתר.
