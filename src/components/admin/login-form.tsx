"use client";

import { signIn } from "@/app/admin/login/actions";
import { describe, Field, SubmitButton, TextInput, useAdminForm } from "./form";

export function LoginForm() {
  const { state, pending, formProps } = useAdminForm(signIn);
  const error = state.status === "error" ? state.message : undefined;
  return (
    <form {...formProps} className="flex w-full flex-col gap-6">
      <Field label="Password" name="password" error={error}>
        <TextInput
          {...describe("password", error)}
          type="password"
          autoComplete="current-password"
          required
          autoFocus
        />
      </Field>
      <SubmitButton pending={pending} pendingLabel="Signing in…" fullWidth>
        Sign in
      </SubmitButton>
    </form>
  );
}
