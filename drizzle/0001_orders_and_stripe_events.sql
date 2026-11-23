CREATE TYPE "public"."order_status" AS ENUM('pending', 'authorized', 'paid', 'canceled', 'expired', 'refunded');--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"product_id" integer NOT NULL,
	"product_name" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price_cents" integer NOT NULL,
	"amount_total_cents" integer NOT NULL,
	"currency" char(3) NOT NULL,
	"stripe_checkout_session_id" text,
	"stripe_payment_intent_id" text,
	"customer_email" text,
	"shipping_address" jsonb,
	"cancel_reason" text,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_stripeCheckoutSessionId_unique" UNIQUE("stripe_checkout_session_id"),
	CONSTRAINT "orders_stripePaymentIntentId_unique" UNIQUE("stripe_payment_intent_id"),
	CONSTRAINT "orders_quantity_pos" CHECK ("orders"."quantity" > 0),
	CONSTRAINT "orders_amounts_nonneg" CHECK ("orders"."unit_price_cents" >= 0 AND "orders"."amount_total_cents" >= 0),
	CONSTRAINT "orders_currency_iso" CHECK ("orders"."currency" ~ '^[A-Z]{3}$')
);
--> statement-breakpoint
CREATE TABLE "stripe_events" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_product_id_idx" ON "orders" USING btree ("product_id");