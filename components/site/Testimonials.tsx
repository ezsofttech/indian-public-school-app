"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, Quote, Star, User } from "lucide-react";
import { SectionHeading } from "@/components/site/Reveal";
import { EASE } from "@/lib/motion-presets";
import { homeData, text } from "@/lib/site-data";
import { useSiteData } from "@/components/site/SiteDataProvider";
import { getOptionalApi, unwrapCollection } from "@/lib/api-client";
import { getAssetUrl } from "@/lib/utils";

function TestimonialAvatar({ src, name }: { src?: string; name: string }) {
  const [failed, setFailed] = useState(false);

  const cleanSrc = src && !src.includes("Anonymous.png") ? src : undefined;

  if (!cleanSrc || failed) {
    const initials = name
      ? name
          .trim()
          .split(/\s+/)
          .map((n) => n[0])
          .filter(Boolean)
          .slice(0, 2)
          .join("")
          .toUpperCase()
      : "";

    return (
      <div
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary text-xs border border-primary/20 shadow-xs"
        aria-hidden
      >
        {initials || <User className="size-5 text-primary/70" />}
      </div>
    );
  }

  return (
    <img
      src={cleanSrc}
      alt={name}
      onError={() => setFailed(true)}
      className="size-11 shrink-0 rounded-full object-cover border-2 border-gold/40 shadow-xs"
    />
  );
}

export function Testimonials() {
  const siteData = useSiteData();
  const initialReviews = (siteData.reviewsItems?.length
    ? siteData.reviewsItems
    : (Array.isArray(homeData(siteData).reviews) ? homeData(siteData).reviews as Record<string, unknown>[] : [])) || [];

  const [reviewsList, setReviewsList] = useState<Record<string, unknown>[]>(initialReviews);

  useEffect(() => {
    let mounted = true;
    async function loadReviews() {
      const response = await getOptionalApi<any>("/reviews", { limit: 20, sortOrder: "desc", isApproved: "true" });
      const items = unwrapCollection(response);
      if (mounted && items && items.length > 0) {
        setReviewsList(items as Record<string, unknown>[]);
      }
    }
    loadReviews();
    return () => {
      mounted = false;
    };
  }, []);

  const items = reviewsList
    .filter((review) => review.isApproved !== false)
    .map((review) => {
      const quoteText = text(review.feedback || review.quote || review.message || review.comment);
      const nameText = text(review.name || review.author || review.title);
      if (!quoteText && !nameText) return null;

      const rawAvatar = text(
        review.avatar ||
        review.avatarUrl ||
        review.image ||
        review.photo ||
        review.photoUrl ||
        review.avatar_url ||
        review.userImage
      );

      return {
        quote: quoteText,
        name: nameText || "Anonymous",
        role: text(review.batch || review.role, "School community"),
        rating: Math.min(5, Math.max(1, Number(review.rating) || 5)),
        avatar: rawAvatar ? getAssetUrl(rawAvatar) : undefined,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);

  const go = (next: number) => {
    if (!items.length) return;
    setDir(next > index || (index === items.length - 1 && next === 0) ? 1 : -1);
    setIndex((next + items.length) % items.length);
  };

  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => {
      setDir(1);
      setIndex((i) => (i + 1) % items.length);
    }, 7000);
    return () => clearInterval(t);
  }, [items.length]);

  if (!items.length) {
    return null;
  }

  const t = items[index] ?? items[0]!;

  return (
    <section className="py-20 lg:py-32">
      <div className="container-page">
        <SectionHeading
          eyebrow="Testimonials"
          title="What families and students say"
          description="Voices from our community."
        />

        <div className="relative mx-auto mt-14 max-w-3xl">
          <div className="relative min-h-[320px] overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-lift sm:min-h-[280px] sm:p-12">
            <Quote className="size-9 text-gold" aria-hidden />
            <AnimatePresence mode="wait" initial={false} custom={dir}>
              <motion.blockquote
                key={index}
                custom={dir}
                initial={{ opacity: 0, x: dir * 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir * -40 }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                <p className="mt-5 font-display text-xl leading-snug sm:text-2xl">{t.quote.replace(/^["'\u201C\u201D]+|["'\u201C\u201D]+$/g, "")}</p>
                <footer className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-border/40 pt-5">
                  <div className="flex items-center gap-3">
                    <TestimonialAvatar src={t.avatar} name={t.name} />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5" aria-label={`${t.rating} out of 5`}>
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="size-4 fill-gold text-gold" />
                    ))}
                  </div>
                </footer>
              </motion.blockquote>
            </AnimatePresence>
          </div>

          {items.length > 1 && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => go(index - 1)}
                aria-label="Previous testimonial"
                className="grid size-10 place-items-center rounded-full border border-border transition-all hover:-translate-x-0.5 hover:bg-secondary"
              >
                <ChevronLeft className="size-4" />
              </button>
              <div className="flex gap-2">
                {items.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => go(i)}
                    aria-label={`Go to testimonial ${i + 1}`}
                    className="h-1.5 rounded-full bg-border transition-all"
                    style={{
                      width: i === index ? 28 : 10,
                      backgroundColor: i === index ? "var(--gold)" : undefined,
                    }}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => go(index + 1)}
                aria-label="Next testimonial"
                className="grid size-10 place-items-center rounded-full border border-border transition-all hover:translate-x-0.5 hover:bg-secondary"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}


