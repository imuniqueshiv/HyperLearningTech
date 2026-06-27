import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { AuthInput } from "@/components/auth/auth-input";
import { OAuthButton } from "@/components/auth/oauth-button";

export default function SignInPage() {
  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-2 text-center lg:text-left">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="text-muted-foreground text-sm">
          Enter your credentials to access your workspace
        </p>
      </div>

      <form className="flex flex-col gap-5 mt-2">
        <AuthInput
          id="email"
          type="email"
          label="Email address"
          placeholder="name@student.university.edu"
        />

        <AuthInput
          id="password"
          type="password"
          label="Password"
          placeholder="••••••••"
          rightElement={
            <Link
              href="#"
              className="text-xs font-medium text-[#1D4ED8] transition-colors hover:text-[#1E40AF] dark:text-blue-400 dark:hover:text-blue-300"
            >
              Forgot password?
            </Link>
          }
        />

        <button
          type="button"
          className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] px-4 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#1E40AF] hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2 dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          Sign In
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      </form>

      <div className="relative mt-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-3 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <OAuthButton />

      <p className="text-center text-sm text-muted-foreground mt-2">
        Don&apos;t have an account?{" "}
        <Link
          href="/sign-up"
          className="font-semibold text-[#1D4ED8] transition-colors hover:text-[#1E40AF] hover:underline dark:text-blue-400 dark:hover:text-blue-300"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
