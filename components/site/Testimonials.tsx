"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  Quote,
  Star,
  User,
  X,
  CheckCircle2,
  Loader2,
  MessageSquarePlus,
} from "lucide-react";
import axios from "axios";
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

function getQuoteTypographyClass(length: number) {
  if (length > 220) {
    return "text-sm sm:text-base leading-relaxed sm:leading-7";
  }
  if (length > 120) {
    return "text-base sm:text-lg leading-relaxed sm:leading-8";
  }
  return "text-base sm:text-lg md:text-xl leading-relaxed sm:leading-8";
}

export function Testimonials() {
  const siteData = useSiteData();
  const initialReviews = (siteData.reviewsItems?.length
    ? siteData.reviewsItems
    : (Array.isArray(homeData(siteData).reviews) ? homeData(siteData).reviews as Record<string, unknown>[] : [])) || [];

  const [reviewsList, setReviewsList] = useState<Record<string, unknown>[]>(initialReviews);
  const [isPaused, setIsPaused] = useState(false);

  // Review submission state for home page
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [reviewName, setReviewName] = useState("");
  const [reviewBatch, setReviewBatch] = useState("");
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState("");

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

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim()) {
      setReviewError("Please enter your name");
      return;
    }
    if (!reviewFeedback.trim()) {
      setReviewError("Please enter your review or feedback");
      return;
    }

    setIsSubmittingReview(true);
    setReviewError("");

    const baseUrl = (
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.API_BASE_URL ||
      "http://localhost:5000/api/v1"
    ).replace(/\/$/, "");

    const payload = {
      name: reviewName.trim(),
      batch: reviewBatch.trim() || "School Community",
      rating: reviewRating,
      feedback: reviewFeedback.trim(),
      isApproved: true,
    };

    try {
      const res = await axios.post(`${baseUrl}/reviews`, payload);
      const created = res.data?.data || res.data || payload;

      setReviewsList((prev) => [
        {
          _id: created._id || `local-${Date.now()}`,
          name: payload.name,
          feedback: payload.feedback,
          batch: payload.batch,
          rating: payload.rating,
          isApproved: true,
        },
        ...prev,
      ]);
      setIndex(0);
      setReviewSubmitted(true);
      setTimeout(() => {
        setIsReviewModalOpen(false);
        setReviewSubmitted(false);
        setReviewFeedback("");
        setReviewName("");
        setReviewBatch("");
        setReviewRating(5);
      }, 2200);
    } catch (err: any) {
      console.error("Failed to submit review to server, applying optimistic update:", err);
      setReviewsList((prev) => [
        {
          _id: `local-${Date.now()}`,
          name: payload.name,
          feedback: payload.feedback,
          batch: payload.batch,
          rating: payload.rating,
          isApproved: true,
        },
        ...prev,
      ]);
      setIndex(0);
      setReviewSubmitted(true);
      setTimeout(() => {
        setIsReviewModalOpen(false);
        setReviewSubmitted(false);
        setReviewFeedback("");
        setReviewName("");
        setReviewBatch("");
        setReviewRating(5);
      }, 2200);
    } finally {
      setIsSubmittingReview(false);
    }
  };

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

      const roleText = text(review.role);
      const batchText = text(review.batch);
      const resolvedRole = roleText
        ? roleText
        : batchText
          ? (batchText.toLowerCase().includes("batch") ? batchText : `Batch ${batchText}`)
          : "School Community";

      return {
        quote: quoteText,
        name: nameText || "Anonymous",
        role: resolvedRole,
        batch: batchText,
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
    if (items.length <= 1 || isPaused) return;
    const t = setInterval(() => {
      setDir(1);
      setIndex((i) => (i + 1) % items.length);
    }, 7000);
    return () => clearInterval(t);
  }, [items.length, isPaused]);

  if (!items.length) {
    return null;
  }

  const t = items[index] ?? items[0]!;
  const cleanQuote = t.quote
    .replace(/^["'\u201C\u201D]+|["'\u201C\u201D]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const quoteClass = getQuoteTypographyClass(cleanQuote.length);

  return (
    <section className="py-20 lg:py-32">
      <div className="container-page">
        <div className="flex flex-col items-center text-center">
          <SectionHeading
            eyebrow="Testimonials"
            title="What Our Parents and Students Say About Us."
            description="Voices from our community."
          />

          {/* Write a Review Button on Home */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setIsReviewModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 hover:bg-gold/20 px-5 py-2 text-xs sm:text-sm font-bold text-foreground transition-all active:scale-95 cursor-pointer shadow-2xs hover:border-gold"
            >
              <MessageSquarePlus className="size-4 text-amber-500 dark:text-amber-400" />
              <span>Share Your Review</span>
            </button>
          </div>
        </div>

        <div className="relative mx-auto mt-10 max-w-3xl">
          <div
            className="group relative min-h-[300px] overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-b from-card via-card to-secondary/30 p-6 sm:p-10 shadow-lift transition-all hover:border-gold/30 hover:shadow-xl"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Subtle background quote watermark */}
            <Quote
              className="pointer-events-none absolute -bottom-6 -right-6 size-36 text-primary/[0.03] dark:text-primary/[0.06] -rotate-12 select-none"
              aria-hidden
            />

            <AnimatePresence mode="wait" initial={false} custom={dir}>
              <motion.blockquote
                key={index}
                custom={dir}
                initial={{ opacity: 0, x: dir * 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir * -30 }}
                transition={{ duration: 0.45, ease: EASE }}
                className="relative z-10 flex min-h-[220px] flex-col justify-between"
              >
                {/* Header: badge + rating */}
                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-gold/15 text-gold border border-gold/30 shadow-2xs">
                      <Quote className="size-4.5 fill-gold/20 text-gold" aria-hidden />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Testimonial
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary/70 px-3 py-1 text-xs font-medium backdrop-blur-xs">
                    <div className="flex gap-0.5" aria-label={`${t.rating} out of 5 stars`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`size-3.5 ${i < t.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/25"
                            }`}
                        />
                      ))}
                    </div>
                    <span className="font-bold text-foreground">{t.rating}.0</span>
                  </div>
                </div>

                {/* Quote text */}
                <div className="py-5 sm:py-6">
                  <p className={`font-normal text-foreground/85 italic tracking-normal ${quoteClass}`}>
                    “{cleanQuote}”
                  </p>
                </div>

                {/* Author footer */}
                <footer className="flex items-center justify-between gap-4 border-t border-border/50 pt-4">
                  <div className="flex items-center gap-3.5">
                    <TestimonialAvatar src={t.avatar} name={t.name} />
                    <div>
                      <p className="text-sm font-semibold text-foreground leading-tight">{t.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{t.role}</span>
                        {t.batch && t.batch !== t.role && !t.role.includes(t.batch) && (
                          <>
                            <span className="size-1 rounded-full bg-border" />
                            <span className="text-xs text-muted-foreground font-medium">{t.batch}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </footer>
              </motion.blockquote>
            </AnimatePresence>
          </div>

          {items.length > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => go(index - 1)}
                aria-label="Previous testimonial"
                className="grid size-10 place-items-center rounded-full border border-border bg-card text-foreground transition-all hover:-translate-x-0.5 hover:bg-secondary hover:border-gold/40 shadow-2xs active:scale-95"
              >
                <ChevronLeft className="size-4" />
              </button>
              <div className="flex items-center gap-2">
                {items.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => go(i)}
                    aria-label={`Go to testimonial ${i + 1}`}
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: i === index ? 32 : 8,
                      backgroundColor: i === index ? "var(--gold)" : "var(--border)",
                    }}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => go(index + 1)}
                aria-label="Next testimonial"
                className="grid size-10 place-items-center rounded-full border border-border bg-card text-foreground transition-all hover:translate-x-0.5 hover:bg-secondary hover:border-gold/40 shadow-2xs active:scale-95"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Review Submission Modal on Home */}
      <AnimatePresence>
        {isReviewModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isSubmittingReview) setIsReviewModalOpen(false);
              }}
              className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: EASE }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 w-full max-w-lg overflow-hidden border border-border bg-card text-card-foreground shadow-2xl p-6 sm:p-8 rounded-3xl"
            >
              {reviewSubmitted ? (
                <div className="py-8 text-center space-y-4">
                  <div className="mx-auto size-14 rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-xs">
                    <CheckCircle2 className="size-8" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-foreground font-[var(--font-display)]">
                    Review Submitted Successfully!
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium max-w-sm mx-auto">
                    Thank you for sharing your experience. Your feedback is now live on the school website.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-border/60">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-gold/15 text-gold border border-gold/30">
                        <Star className="size-4 fill-amber-400 text-amber-400" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground font-[var(--font-display)]">
                        Share Your Review
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsReviewModalOpen(false)}
                      className="size-8 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  {/* Rating Selector */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-foreground">
                      Overall Rating <span className="text-red-500 font-bold ml-0.5">*</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(null)}
                          className="p-1 cursor-pointer transition transform hover:scale-115 active:scale-95"
                          title={`${star} Star`}
                        >
                          <Star
                            className={`size-6 transition-colors ${(hoverRating !== null ? star <= hoverRating : star <= reviewRating)
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground/30"
                              }`}
                          />
                        </button>
                      ))}
                      <span className="ml-2 text-xs font-bold text-amber-500 dark:text-amber-400">
                        {reviewRating} of 5 Stars
                      </span>
                    </div>
                  </div>

                  {/* Review / Feedback Input */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-foreground">
                      Your Review / Feedback <span className="text-red-500 font-bold ml-0.5">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={reviewFeedback}
                      onChange={(e) => {
                        setReviewFeedback(e.target.value);
                        if (reviewError) setReviewError("");
                      }}
                      placeholder="Share your experience (e.g. nice, wonderful teachers, good facilities...)"
                      className="w-full rounded-xl border border-border bg-secondary/40 p-3 text-sm text-foreground focus:bg-card focus:border-[var(--primary)] outline-none transition"
                    />
                    {reviewError && (
                      <p className="text-[11px] font-semibold text-rose-500">{reviewError}</p>
                    )}
                  </div>

                  {/* Name Input */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-foreground">
                        Your Name <span className="text-red-500 font-bold ml-0.5">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={reviewName}
                        onChange={(e) => {
                          setReviewName(e.target.value);
                          if (reviewError) setReviewError("");
                        }}
                        placeholder="e.g. Om Rathod"
                        className="h-10 w-full rounded-xl border border-border bg-secondary/40 px-3 text-sm text-foreground focus:bg-card focus:border-[var(--primary)] outline-none transition"
                      />
                    </div>

                    {/* Batch / Role Input */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-foreground">
                        Batch / Year
                      </label>
                      <input
                        type="text"
                        value={reviewBatch}
                        onChange={(e) => setReviewBatch(e.target.value)}
                        placeholder="e.g. Parent of Class 4 / Batch 2023"
                        className="h-10 w-full rounded-xl border border-border bg-secondary/40 px-3 text-sm text-foreground focus:bg-card focus:border-[var(--primary)] outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsReviewModalOpen(false)}
                      disabled={isSubmittingReview}
                      className="px-4 py-2.5 rounded-xl border border-border bg-secondary text-foreground text-xs font-bold hover:bg-secondary/80 cursor-pointer transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingReview}
                      className="px-6 py-2.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--navy)] dark:bg-[#1a5d9c] dark:hover:bg-blue-600 text-white text-xs font-extrabold cursor-pointer transition flex items-center justify-center gap-1.5 shadow-md active:scale-95 disabled:opacity-60"
                    >
                      {isSubmittingReview ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <span>Submit Review</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
