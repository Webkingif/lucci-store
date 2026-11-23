"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import {
  adjustStockAction,
  setStockAction,
} from "@/app/admin/(panel)/inventory/actions";
import { Button } from "@/components/ui/button";
import type { StockFormState } from "@/lib/admin/validation";
import { cn } from "@/lib/utils";
import { inputClass, useAdminForm } from "./form";

const idle: StockFormState = { status: "idle" };

/**
 * Stock editor for one product:
 * - Add / remove an amount: relative and atomic, so it never conflicts with a
 *   sale happening at the same time.
 * - Set to a count: sends the count the admin saw as `expected`; if a sale
 *   changed it meanwhile, the server reports a conflict instead of
 *   overwriting it.
 *
 * `baseline` is the newest stock this component knows: the server prop after
 * a refresh, or the count an action returned. `expected` always follows it.
 */
export function StockControls({
  productId,
  productName,
  stock,
}: {
  productId: number;
  productName: string;
  stock: number;
}) {
  const adjust = useAdminForm(adjustStockAction, idle);
  const set = useAdminForm(setStockAction, idle);

  const [baseline, setBaseline] = useState(stock);
  const [setValue, setSetValue] = useState(String(stock));
  const [seen, setSeen] = useState({
    stock,
    adjust: adjust.state,
    set: set.state,
  });

  // Adopt newer values during render ("storing information from previous
  // renders"): a refreshed server prop, or the count an action returned.
  if (
    stock !== seen.stock ||
    adjust.state !== seen.adjust ||
    set.state !== seen.set
  ) {
    let next = baseline;
    if (stock !== seen.stock) next = stock;
    if (adjust.state !== seen.adjust && adjust.state.stock !== undefined) {
      next = adjust.state.stock;
    }
    if (set.state !== seen.set && set.state.stock !== undefined) {
      next = set.state.stock;
    }
    setSeen({ stock, adjust: adjust.state, set: set.state });
    if (next !== baseline) {
      setBaseline(next);
      setSetValue(String(next));
    }
  }

  const id = `stock-${productId}`;
  const pending = adjust.pending || set.pending;

  return (
    <div className="flex flex-col gap-3">
      <p className="tabular-nums" aria-live="polite">
        <span className="font-display text-title">{baseline}</span>
        <span className="sr-only"> in stock for {productName}</span>
      </p>

      <form {...adjust.formProps} className="flex items-center gap-1">
        <input type="hidden" name="id" value={productId} />
        <input type="hidden" name="mode" value="adjust" />
        <label htmlFor={`${id}-amount`} className="sr-only">
          Units to add or remove for {productName}
        </label>
        <input
          id={`${id}-amount`}
          name="amount"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          defaultValue={1}
          required
          aria-invalid={adjust.state.errors?.amount ? true : undefined}
          aria-describedby={
            adjust.state.message ? `${id}-adjust-msg` : undefined
          }
          className={cn(inputClass, "h-9 w-20")}
        />
        <Button
          type="submit"
          name="direction"
          value="remove"
          variant="secondary"
          size="sm"
          disabled={pending}
          aria-label={`Remove units from ${productName}`}
          className="px-3"
        >
          <Minus className="size-3.5" strokeWidth={1.5} />
        </Button>
        <Button
          type="submit"
          name="direction"
          value="add"
          variant="secondary"
          size="sm"
          disabled={pending}
          aria-label={`Add units to ${productName}`}
          className="px-3"
        >
          <Plus className="size-3.5" strokeWidth={1.5} />
        </Button>
      </form>
      <Message id={`${id}-adjust-msg`} state={adjust.state} />

      <form {...set.formProps} className="flex items-center gap-1">
        <input type="hidden" name="id" value={productId} />
        <input type="hidden" name="mode" value="set" />
        <input type="hidden" name="expected" value={baseline} />
        <label htmlFor={`${id}-set`} className="sr-only">
          Set stock for {productName}
        </label>
        <input
          id={`${id}-set`}
          name="stock"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          required
          value={setValue}
          onChange={(event) => setSetValue(event.target.value)}
          aria-invalid={set.state.status === "error" || undefined}
          aria-describedby={set.state.message ? `${id}-set-msg` : undefined}
          className={cn(inputClass, "h-9 w-20")}
        />
        <Button
          type="submit"
          variant="secondary"
          size="sm"
          disabled={pending}
          className="px-3"
        >
          {set.pending ? "Saving" : "Set"}
        </Button>
      </form>
      <Message id={`${id}-set-msg`} state={set.state} />
    </div>
  );
}

function Message({ id, state }: { id: string; state: StockFormState }) {
  if (!state.message) return null;
  return (
    <p
      id={id}
      role={state.status === "error" ? "alert" : "status"}
      className={cn(
        "-mt-1 max-w-60 text-caption",
        state.status === "error" ? "text-danger" : "text-success",
      )}
    >
      {state.message}
    </p>
  );
}
