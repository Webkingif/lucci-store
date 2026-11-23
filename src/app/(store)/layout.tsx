import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

/** Storefront chrome. The admin area (src/app/admin) has its own shell. */
export default function StoreLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
