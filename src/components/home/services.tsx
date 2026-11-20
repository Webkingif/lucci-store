import { Eyebrow } from "@/components/ui/layout";

type ServicesProps = {
  items: readonly { title: string; body: string }[];
};

/** Row of customer-service promises separated by hairlines. */
export function Services({ items }: ServicesProps) {
  return (
    <section aria-label="Services" className="border-t">
      <ul className="container-page grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {items.map((item) => (
          <li
            key={item.title}
            className="flex flex-col items-center gap-2 py-8 text-center sm:px-6 sm:py-12"
          >
            <Eyebrow>{item.title}</Eyebrow>
            <p className="text-muted">{item.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
