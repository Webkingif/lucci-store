"use client";

import {
  startTransition,
  useActionState,
  type ComponentProps,
  type FormEvent,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { initialFormState, type FormState } from "@/lib/admin/validation";

type FormAction<S extends FormState> = (
  state: S,
  formData: FormData,
) => Promise<S>;

/**
 * useActionState for admin forms. Submits inside a transition from onSubmit
 * instead of through the form's `action` prop, because React resets a form
 * after an action submit and the admin would lose their input on a
 * validation error. Without JavaScript the native `action` still works.
 */
export function useAdminForm<S extends FormState = FormState>(
  action: FormAction<S>,
  initialState: S = initialFormState as S,
) {
  // S is a plain object type, so Awaited<S> is S; TypeScript can't prove it
  // for a generic, hence the casts.
  const [state, formAction, pending] = useActionState<S, FormData>(
    action as (state: Awaited<S>, payload: FormData) => Promise<S>,
    initialState as Awaited<S>,
  );

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Include the pressed button's name/value, as a native submit would.
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const formData = new FormData(event.currentTarget, submitter);
    startTransition(() => formAction(formData));
  }

  return { state, pending, formProps: { action: formAction, onSubmit } };
}

const control =
  "w-full border bg-paper px-3 text-body text-ink placeholder:text-muted aria-invalid:border-danger";

export const inputClass = cn(control, "h-11");

export function Field({
  label,
  name,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  name: string;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={name} className="eyebrow text-muted">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${name}-hint`} className="text-caption text-muted">
          {hint}
        </p>
      )}
      <FieldError id={`${name}-error`} message={error} />
    </div>
  );
}

export function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-caption text-danger">
      {message}
    </p>
  );
}

/** Accessibility attributes linking a control to its Field's hint and error. */
export function describe(name: string, error?: string, hint?: string) {
  return {
    id: name,
    name,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error
      ? `${name}-error`
      : hint
        ? `${name}-hint`
        : undefined,
  } as const;
}

export function TextInput(props: ComponentProps<"input">) {
  return <input {...props} className={cn(inputClass, props.className)} />;
}

export function TextArea(props: ComponentProps<"textarea">) {
  return (
    <textarea
      {...props}
      className={cn(control, "min-h-32 py-2", props.className)}
    />
  );
}

export function Select(props: ComponentProps<"select">) {
  return <select {...props} className={cn(inputClass, props.className)} />;
}

/** Form-level message from the last submit. */
export function FormMessage({ state }: { state: FormState }) {
  if (!state.message) return null;
  return (
    <p
      role={state.status === "error" ? "alert" : "status"}
      className={cn(
        "border-t border-b py-3",
        state.status === "error" ? "text-danger" : "text-success",
      )}
    >
      {state.message}
    </p>
  );
}

export function SubmitButton({
  pending,
  children,
  pendingLabel = "Saving…",
  ...props
}: ComponentProps<typeof Button> & {
  pending: boolean;
  pendingLabel?: string;
}) {
  return (
    <Button
      type="submit"
      disabled={pending}
      aria-busy={pending || undefined}
      {...props}
    >
      {pending ? pendingLabel : children}
    </Button>
  );
}
