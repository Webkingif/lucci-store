import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import StoreNotFound from "./(store)/not-found";

// Unmatched URLs render here, outside the (store) layout, so this adds the
// storefront chrome itself. notFound() inside storefront pages renders
// (store)/not-found.tsx within the store layout instead.
export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <StoreNotFound />
      </main>
      <Footer />
    </>
  );
}
