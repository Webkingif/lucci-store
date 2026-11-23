import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { Eyebrow } from "@/components/ui/layout";
import { readAdminSession } from "@/lib/admin/session";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = { title: "Sign in" };

export default function AdminLoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-(--gutter) py-16">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col gap-3 text-center">
          <p className="font-display text-2xl tracking-[0.18em] uppercase">
            {siteConfig.name}
          </p>
          <Eyebrow className="text-muted">Admin</Eyebrow>
        </div>
        <Suspense fallback={<LoginForm />}>
          <SignedInRedirect />
        </Suspense>
      </div>
    </div>
  );
}

/** Already signed in: skip the form. */
async function SignedInRedirect() {
  if (await readAdminSession()) redirect("/admin/products");
  return <LoginForm />;
}
