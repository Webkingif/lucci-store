"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import type { FormState } from "@/lib/admin/validation";
import type { AdminCategory } from "@/types";
import {
  describe,
  Field,
  FormMessage,
  SubmitButton,
  TextArea,
  TextInput,
  useAdminForm,
} from "./form";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function CategoryForm({
  action,
  category,
}: {
  action: Action;
  category?: AdminCategory;
}) {
  const { state, pending, formProps } = useAdminForm(action);
  const errors = state.errors ?? {};
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(category));

  return (
    <form {...formProps} noValidate className="flex max-w-2xl flex-col gap-6">
      {category && <input type="hidden" name="id" value={category.id} />}
      <FormMessage state={state} />
      <Field label="Title" name="title" error={errors.title}>
        <TextInput
          {...describe("title", errors.title)}
          required
          maxLength={80}
          defaultValue={category?.title}
          onChange={(event) => {
            if (!slugEdited) setSlug(toSlug(event.target.value));
          }}
        />
      </Field>
      <Field
        label="Slug"
        name="slug"
        hint={`Collection URL: /collections/${slug || "…"}`}
        error={errors.slug}
      >
        <TextInput
          {...describe("slug", errors.slug, "hint")}
          required
          maxLength={80}
          value={slug}
          onChange={(event) => {
            setSlugEdited(true);
            setSlug(event.target.value);
          }}
        />
      </Field>
      <Field label="Description" name="description" error={errors.description}>
        <TextArea
          {...describe("description", errors.description)}
          required
          maxLength={1000}
          defaultValue={category?.description}
        />
      </Field>
      <Field
        label="Position"
        name="position"
        hint="Order in the storefront filter bar; lower first"
        error={errors.position}
      >
        <TextInput
          {...describe("position", errors.position, "hint")}
          inputMode="numeric"
          className="max-w-32"
          defaultValue={category?.position ?? 0}
        />
      </Field>
      <div className="flex items-center gap-6 border-t pt-6">
        <SubmitButton pending={pending}>
          {category ? "Save changes" : "Create category"}
        </SubmitButton>
        <Link
          href="/admin/categories"
          className={buttonVariants({ variant: "text" })}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

/** Delete an empty category. Categories with products can't be deleted. */
export function DeleteCategoryForm({
  action,
  category,
}: {
  action: Action;
  category: AdminCategory;
}) {
  const { state, pending, formProps } = useAdminForm(action);
  const blocked = category.productCount > 0;

  return (
    <form
      {...formProps}
      onSubmit={(event) => {
        if (
          !window.confirm(`Delete “${category.title}”? This can't be undone.`)
        ) {
          event.preventDefault();
          return;
        }
        formProps.onSubmit(event);
      }}
      className="flex max-w-2xl flex-col gap-4 border-t pt-6"
    >
      <input type="hidden" name="id" value={category.id} />
      <h2 className="eyebrow text-muted">Delete category</h2>
      <FormMessage state={state} />
      {blocked ? (
        <p className="text-muted">
          This category has {category.productCount}{" "}
          {category.productCount === 1 ? "product" : "products"}. Move them to
          another category before deleting it.
        </p>
      ) : (
        <div>
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            disabled={pending}
            className="border-danger text-danger hover:bg-danger hover:text-paper"
          >
            {pending ? "Deleting…" : "Delete category"}
          </Button>
        </div>
      )}
    </form>
  );
}
