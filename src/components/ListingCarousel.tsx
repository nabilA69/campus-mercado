import ListingCard, { type ListingCardData } from "./ListingCard";

// Horizontal, swipeable product carousel (a "slideshow" row). Pure CSS scroll-snap,
// no JS library — stays light for low-bandwidth connections.
export default function ListingCarousel({
  title,
  cards,
}: {
  title: string;
  cards: ListingCardData[];
}) {
  if (cards.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold mb-3">{title}</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory -mx-4 px-4">
        {cards.map((c) => (
          <div key={c.id} className="snap-start shrink-0 w-40 sm:w-44">
            <ListingCard listing={c} />
          </div>
        ))}
      </div>
    </section>
  );
}
