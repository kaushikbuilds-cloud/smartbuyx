# SmartBuyX deployment guide

## 1. Prepare Supabase

Create a separate **production** Supabase project. In its SQL Editor, apply every unapplied file in `supabase/migrations` in numeric order. Do not rerun a migration when its objects already exist; apply only migrations not yet present in that project.

Configure Supabase Auth:

- Set the Site URL to the production application URL.
- Add `https://your-domain.com/auth/callback` to Redirect URLs.
- Enable Google only after adding the Google OAuth client ID and secret in Supabase.
- Keep Row Level Security enabled; SmartBuyX relies on it.

`supabase/seed.sql` is only for local development and staging. It creates sample accounts and listings; never apply it to a production database.

## 2. Configure environment variables

Copy `.env.example` locally, then set these in Vercel or your hosting provider:

| Variable | Used for |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Database and Auth |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | Trusted server routes only |
| `NEXT_PUBLIC_APP_URL` | OAuth redirects and server callbacks |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Razorpay checkout |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook verification |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Browser checkout |
| `OPENAI_API_KEY` or `GEMINI_API_KEY` | AI features |

Never use `NEXT_PUBLIC_` for a secret. Rotate any key that has been shared in chat, screenshots, or source control.

## 3. Deploy

```bash
npm ci
npm run typecheck
npm run build
```

Connect the repository to Vercel and configure the variables above. Vercel runs `next build`; use `npm run dev` locally, not `npm run start`. `npm run start` only works after a successful production build.

## 4. Before accepting live orders

- Set the Razorpay webhook to the deployed payment-webhook route and add its matching secret.
- Create at least one `admin` or `superadmin` profile in Supabase.
- Add live delivery-provider credentials before enabling automated dispatch.
- Test email/password, Google OAuth, checkout, order status updates, and notifications in staging.
