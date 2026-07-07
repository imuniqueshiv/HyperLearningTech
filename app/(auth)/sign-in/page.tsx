import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { AuthInput } from "@/components/auth/auth-input";
import { OAuthButton } from "@/components/auth/oauth-button";

export default function SignInPage() {
  return (
    <div className="flex flex-col gap-4 w-full max-w-[360px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-2 text-center items-center mb-4">
        <div className="h-20 w-20 rounded-full bg-zinc-100 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/10 flex items-center justify-center mb-2 shadow-inner">
          <Image
            src="/hl-logo.png"
            alt="Logo"
            width={32}
            height={32}
            className="opacity-80"
          />
        </div>
        <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
          Log in to Hyper Learning
        </h1>
      </div>

      <form className="flex flex-col gap-3">
        <AuthInput
          id="email"
          type="email"
          label=""
          placeholder="Email address or username"
        />

        <AuthInput
          id="password"
          type="password"
          label=""
          placeholder="Password"
        />

        <div className="flex justify-end w-full mb-1">
          <Link
            href="#"
            className="text-[11px] font-semibold text-foreground/70 transition-colors hover:text-foreground"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="button"
          className="mt-1 flex w-full items-center justify-center rounded-full bg-[#0064e0] px-4 py-3 text-[15px] font-bold text-white transition-all hover:bg-[#0054c2] focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
        >
          Log in
        </button>
      </form>

      <div className="relative mt-3 mb-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/50" />
        </div>
        <div className="relative flex justify-center text-xs font-semibold uppercase tracking-wider">
          <span className="bg-background px-4 text-muted-foreground">Or</span>
        </div>
      </div>

      <OAuthButton />

      <div className="mt-3 flex w-full justify-center rounded-xl border border-zinc-200 dark:border-white/10 p-4 text-[13px] shadow-sm bg-white dark:bg-white/[0.02]">
        <span className="text-muted-foreground mr-1.5">
          Don&apos;t have an account?
        </span>
        <Link
          href="/sign-up"
          className="font-semibold text-[#0064e0] hover:underline"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
