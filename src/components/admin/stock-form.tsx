"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import {
  updateStockAction,
  type StockFormState,
} from "@/app/admin/(panel)/products/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { inputClass } from "./form";

/**
 * Inline stock editor. Sends the stock the admin saw as `expected`, so a sale
 * in between is reported as a conflict instead of being overwritten.
 */
export function StockForm({
  productId,
  productName,
  stock,
}: {
  productId: number;
  productName: string;
  stock: number;
}) {
  const [state, formAction, pending] = useActionState<StockFormState, FormData>(
    updateStockAction,
    { status: "idle" },
  );
  const expected = state.stock ?? stock;
  const messageId = `stock-${productId}-message`;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <form
      action={formAction}
      onSubmit={onSubmit}
      className="flex flex-col gap-1"
    >
      <input type="hidden" name="id" value={productId} />
      <input type="hidden" name="expected" value={expected} />
      <div className="flex items-center gap-2">
        <label htmlFor={`stock-${productId}`} className="sr-only">
          Stock for {productName}
        </label>
        <input
          id={`stock-${productId}`}
          name="stock"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          required
          defaultValue={stock}
          aria-invalid={state.status === "error" || undefined}
          aria-describedby={state.message ? messageId : undefined}
          className={cn(inputClass, "h-9 w-24 aria-invalid:border-danger")}
        />
        <Button type="submit" variant="secondary" size="sm" disabled={pending}>
          {pending ? "Saving" : "Save"}
        </Button>
      </div>
      {state.message && (
        <p
          id={messageId}
          role={state.status === "error" ? "alert" : "status"}
          className={cn(
            "max-w-56 text-caption",
            state.status === "error" ? "text-danger" : "text-success",
          )}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
