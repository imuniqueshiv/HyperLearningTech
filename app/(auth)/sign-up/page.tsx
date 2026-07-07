import Link from "next/link";
import { User } from "lucide-react";

import { AuthInput } from "@/components/auth/auth-input";
import { OAuthButton } from "@/components/auth/oauth-button";

import { branches } from "@/lib/data/branches";

const BRANCHES = branches.map((branch) => {
  if (branch.id === "common") return branch.name;
  let acronym = branch.id.toUpperCase();
  if (branch.id === "civil") acronym = "CE";
  if (branch.id === "ec") acronym = "ECE";
  return `${branch.name} (${acronym})`;
});

const UNIVERSITIES = [
  "Rajiv Gandhi Proudyogiki Vishwavidyalaya (RGPV)",
  "Dr. A.P.J. Abdul Kalam Technical University (AKTU)",
  "Rajasthan Technical University (RTU)",
  "Other",
];

export default function SignUpPage() {
  return (
    <div className="flex flex-col gap-4 w-full max-w-[360px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-2 text-center items-center mb-3">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-[1.25rem] border border-black/5 bg-gradient-to-b from-white to-zinc-50 shadow-sm dark:border-white/10 dark:from-zinc-900 dark:to-zinc-950 mb-2">
          <div className="absolute inset-0 rounded-[1.25rem] ring-1 ring-inset ring-black/5 dark:ring-white/5" />
          <User className="relative z-10 h-7 w-7 text-zinc-700 dark:text-zinc-300" />
        </div>
        <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
          Create an account
        </h1>
      </div>

      <form className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <AuthInput
            id="firstName"
            type="text"
            label=""
            placeholder="First name"
          />
          <AuthInput
            id="lastName"
            type="text"
            label=""
            placeholder="Last name"
          />
        </div>

        <AuthInput
          id="email"
          type="email"
          label=""
          placeholder="Email address"
        />

        <AuthInput
          id="university"
          type="text"
          label=""
          placeholder="University (e.g. RGPV, AKTU, RTU)"
          suggestions={UNIVERSITIES}
        />

        <AuthInput
          id="branch"
          type="text"
          label=""
          placeholder="Engineering Branch"
          suggestions={BRANCHES}
        />

        <AuthInput
          id="password"
          type="password"
          label=""
          placeholder="Password"
          hint="Must be at least 8 characters long."
        />

        <button
          type="button"
          className="mt-1 flex w-full items-center justify-center rounded-full bg-[#0064e0] px-4 py-3 text-[15px] font-bold text-white transition-all hover:bg-[#0054c2] focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
        >
          Sign Up
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

      <div className="mt-3 flex w-full justify-center rounded-xl border border-zinc-200 dark:border-white/10 p-4 text-sm shadow-sm bg-white dark:bg-white/[0.02]">
        <span className="text-muted-foreground mr-1.5">
          Already have an account?
        </span>
        <Link
          href="/sign-in"
          className="font-semibold text-[#0064e0] hover:underline"
        >
          Log in
        </Link>
      </div>
    </div>
  );
}
