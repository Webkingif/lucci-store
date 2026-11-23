"use client";

import { useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { centsToPriceInput, type FormState } from "@/lib/admin/validation";
import type { AdminCategory, AdminProduct, Image } from "@/types";
import {
  describe,
  Field,
  FieldError,
  FormMessage,
  Select,
  SubmitButton,
  TextArea,
  TextInput,
  useAdminForm,
} from "./form";

type ImageRow = Image & { key: string };

const MAX_IMAGES = 12;

function toSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Create and edit form. Stock is set here only on create; existing products
 * change stock on /admin/inventory, which never overwrites a sale.
 */
export function ProductForm({
  action,
  categories,
  product,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  categories: AdminCategory[];
  product?: AdminProduct;
}) {
  const { state, pending, formProps } = useAdminForm(action);
  const errors = state.errors ?? {};
  const isNew = !product;

  // On create the slug follows the name until the admin edits it.
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(!isNew);

  const [images, setImages] = useState<ImageRow[]>(() => {
    const initial = product?.images.length
      ? product.images
      : [{ src: "", alt: "" }];
    return initial.map((image, index) => ({
      ...image,
      key: `initial-${index}`,
    }));
  });
  // Stable keys for rows added later, so reordering keeps input focus right.
  const [addedRows, setAddedRows] = useState(0);

  function addImage() {
    setImages((rows) => [
      ...rows,
      { src: "", alt: "", key: `added-${addedRows}` },
    ]);
    setAddedRows((count) => count + 1);
  }

  function updateImage(index: number, patch: Partial<Image>) {
    setImages((rows) =>
      rows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  }

  function moveImage(index: number, by: -1 | 1) {
    setImages((rows) => {
      const next = [...rows];
      const [row] = next.splice(index, 1);
      next.splice(index + by, 0, row);
      return next;
    });
  }

  return (
    <form {...formProps} noValidate className="flex max-w-3xl flex-col gap-10">
      {product && <input type="hidden" name="id" value={product.id} />}
      <FormMessage state={state} />

      <section aria-label="Details" className="grid gap-6 sm:grid-cols-2">
        <Field
          label="Name"
          name="name"
          error={errors.name}
          className="sm:col-span-2"
        >
          <TextInput
            {...describe("name", errors.name)}
            required
            maxLength={120}
            defaultValue={product?.name}
            onChange={(event) => {
              if (!slugEdited) setSlug(toSlug(event.target.value));
            }}
          />
        </Field>
        <Field
          label="Slug"
          name="slug"
          hint={`Storefront URL: /products/${slug || "…"}`}
          error={errors.slug}
          className="sm:col-span-2"
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
        <Field
          label="Description"
          name="description"
          error={errors.description}
          className="sm:col-span-2"
        >
          <TextArea
            {...describe("description", errors.description)}
            required
            maxLength={4000}
            defaultValue={product?.description}
          />
        </Field>
        <Field label="Category" name="categoryId" error={errors.categoryId}>
          <Select
            {...describe("categoryId", errors.categoryId)}
            required
            defaultValue={product?.categoryId ?? ""}
          >
            <option value="" disabled>
              Choose a category
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.title}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Badge"
          name="badge"
          hint="Optional, e.g. New in"
          error={errors.badge}
        >
          <TextInput
            {...describe("badge", errors.badge, "hint")}
            maxLength={40}
            defaultValue={product?.badge}
          />
        </Field>
      </section>

      <section
        aria-label="Price and stock"
        className="grid gap-6 sm:grid-cols-2"
      >
        <Field
          label="Price"
          name="price"
          hint="In full units, e.g. 2480 or 2480.50"
          error={errors.price}
        >
          <TextInput
            {...describe("price", errors.price, "hint")}
            required
            inputMode="decimal"
            defaultValue={product ? centsToPriceInput(product.price) : ""}
          />
        </Field>
        <Field label="Currency" name="currency" error={errors.currency}>
          <TextInput
            {...describe("currency", errors.currency)}
            required
            maxLength={3}
            className="uppercase"
            defaultValue={product?.currency ?? "USD"}
          />
        </Field>
        {isNew ? (
          <Field label="Stock" name="stock" error={errors.stock}>
            <TextInput
              {...describe("stock", errors.stock)}
              required
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              defaultValue={0}
            />
          </Field>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="eyebrow text-muted">Stock</p>
            <p className="tabular-nums">{product.stock}</p>
            <p className="text-caption text-muted">
              Change stock in{" "}
              <Link href="/admin/inventory" className="link">
                Inventory
              </Link>
              .
            </p>
          </div>
        )}
        <Field
          label="Position"
          name="position"
          hint="Lower numbers show first in Featured"
          error={errors.position}
        >
          <TextInput
            {...describe("position", errors.position, "hint")}
            inputMode="numeric"
            defaultValue={product?.position ?? 0}
          />
        </Field>
      </section>

      <fieldset className="flex flex-col gap-4">
        <legend className="eyebrow text-muted">Images</legend>
        <p className="text-caption text-muted">
          Paste https:// image URLs. The first image is the card image.
        </p>
        <ol className="flex flex-col gap-4">
          {images.map((image, index) => {
            const error = errors[`images.${index}`];
            return (
              <li key={image.key} className="flex flex-col gap-2 border-t pt-4">
                <div className="grid gap-3 sm:grid-cols-[1fr_1fr_8rem_auto]">
                  <label className="flex flex-col gap-1">
                    <span className="text-caption text-muted">
                      Image {index + 1} URL
                    </span>
                    <TextInput
                      name="imageSrc"
                      inputMode="url"
                      value={image.src}
                      aria-invalid={error ? true : undefined}
                      onChange={(event) =>
                        updateImage(index, { src: event.target.value })
                      }
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-caption text-muted">Alt text</span>
                    <TextInput
                      name="imageAlt"
                      value={image.alt}
                      onChange={(event) =>
                        updateImage(index, { alt: event.target.value })
                      }
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-caption text-muted">Fit</span>
                    <Select
                      name="imageFit"
                      value={image.fit ?? "cover"}
                      onChange={(event) =>
                        updateImage(index, {
                          fit:
                            event.target.value === "contain"
                              ? "contain"
                              : undefined,
                        })
                      }
                    >
                      <option value="cover">Cover</option>
                      <option value="contain">Contain</option>
                    </Select>
                  </label>
                  <div className="flex items-end gap-1">
                    <IconButton
                      label={`Move image ${index + 1} up`}
                      disabled={index === 0}
                      onClick={() => moveImage(index, -1)}
                    >
                      <ArrowUp className="size-4" strokeWidth={1.25} />
                    </IconButton>
                    <IconButton
                      label={`Move image ${index + 1} down`}
                      disabled={index === images.length - 1}
                      onClick={() => moveImage(index, 1)}
                    >
                      <ArrowDown className="size-4" strokeWidth={1.25} />
                    </IconButton>
                    <IconButton
                      label={`Remove image ${index + 1}`}
                      onClick={() =>
                        setImages((rows) => rows.filter((_, i) => i !== index))
                      }
                    >
                      <X className="size-4" strokeWidth={1.25} />
                    </IconButton>
                  </div>
                </div>
                <FieldError message={error} />
              </li>
            );
          })}
        </ol>
        <FieldError message={errors.images} />
        <div>
          <Button
            variant="secondary"
            size="sm"
            disabled={images.length >= MAX_IMAGES}
            onClick={addImage}
          >
            Add image
          </Button>
        </div>
      </fieldset>

      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          name="published"
          defaultChecked={product?.published ?? false}
          className="mt-1 size-4 accent-ink"
        />
        <span>
          Published
          <span className="block text-caption text-muted">
            Hidden products don&rsquo;t appear on the storefront and can&rsquo;t
            be bought.
          </span>
        </span>
      </label>

      <div className="flex items-center gap-6 border-t pt-6">
        <SubmitButton pending={pending}>
          {isNew ? "Create product" : "Save changes"}
        </SubmitButton>
        <Link
          href="/admin/products"
          className={buttonVariants({ variant: "text" })}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

function IconButton({
  label,
  children,
  disabled,
  onClick,
}: {
  label: string;
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex size-11 items-center justify-center border transition-colors hover:border-ink disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}
