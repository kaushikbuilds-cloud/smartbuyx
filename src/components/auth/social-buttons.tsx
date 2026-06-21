"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { signInWithGoogle } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";

export function SocialButtons() {
  const [pending, startTransition] = useTransition();
  return (
    <div className="space-y-3">
      <div className="text-center text-sm text-muted-foreground">or continue with</div>
      <div className="grid grid-cols-3 gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-11"
          disabled={pending}
          onClick={() => startTransition(() => signInWithGoogle())}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M21.6 12.227c0-.708-.064-1.39-.182-2.045H12v3.868h5.382a4.6 4.6 0 0 1-1.994 3.018v2.509h3.227c1.886-1.737 2.985-4.296 2.985-7.35Z" />
              <path fill="#34A853" d="M12 22c2.7 0 4.964-.895 6.618-2.423l-3.227-2.509c-.895.6-2.04.955-3.391.955-2.609 0-4.818-1.764-5.605-4.132H3.064v2.59A9.997 9.997 0 0 0 12 22Z" />
              <path fill="#FBBC05" d="M6.395 13.892A6 6 0 0 1 6.082 12c0-.655.112-1.291.314-1.891V7.518H3.064A9.997 9.997 0 0 0 2 12c0 1.614.386 3.14 1.064 4.482l3.331-2.59Z" />
              <path fill="#EA4335" d="M12 5.977c1.473 0 2.795.505 3.836 1.5l2.873-2.873C16.96 2.99 14.697 2 12 2 8.087 2 4.71 4.245 3.064 7.518l3.331 2.591C7.182 7.741 9.39 5.977 12 5.977Z" />
            </svg>
          )}
          Google
        </Button>
        <Button type="button" variant="outline" className="h-11" disabled>
          <svg className="h-4 w-4 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.47H7.078V12h3.047V9.356c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.234 2.686.234v2.953H15.83c-1.491 0-1.956.925-1.956 1.875V12h3.328l-.532 3.47h-2.796v8.385C19.612 22.954 24 17.99 24 12Z"/>
          </svg>
          Facebook
        </Button>
        <Button type="button" variant="outline" className="h-11" disabled>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
          </svg>
          Apple
        </Button>
      </div>
    </div>
  );
}
