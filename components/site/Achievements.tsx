"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SectionHeading } from "@/components/site/Reveal";
import { EASE } from "@/lib/motion-presets";
import {
  firstSection,
  homeData,
  imageUrl,
  text,
  textList,
} from "@/lib/site-data";
import { useSiteData } from "@/components/site/SiteDataProvider";



const CARDS = [
  {
    title: "Pre-Primary Level",
    text: "Play-based learning, cognitive and perceptual motor development designed for readiness for school.",
  },
  {
    title: "Primary Level",
    text: "Foundational academic education exploring enquiry, projects, reading habits and activity-based learning.",
  },
  {
    title: "Secondary Level",
    text: "Guaranteeing key CBSE competencies, conceptual depth and structured academic preparation.",
  },
  {
    title: "Senior Secondary Level",
    text: "Differentiated education across Science, Commerce and Humanities for higher competitive excellence.",
  },
];

const DEFAULT_COURSE_IMAGES = [
  "/assets/Album/PrePrimary.webp",
  "/assets/Album/PrimaryLevel.webp",
  "/assets/Album/SecondaryLevel.webp",
  "/assets/Album/SeniorSecondLevel.webp",
];

export function Achievements() {
  const section = firstSection(homeData(useSiteData()), "section-8");
  const [activeIndex, setActiveIndex] = useState(0);

  const rawCards = Array.isArray(section.cardItem)
    ? (section.cardItem as Record<string, unknown>[])
    : [];

  const cards = rawCards.length
    ? rawCards
    : CARDS.map((c) => ({ heading: c.title, title: c.title, description: c.text }));

  const activeCard = cards[activeIndex] || cards[0];
  const activeCardRec = activeCard as Record<string, unknown>;
  const rawCardFile = (activeCardRec?.fileUrl as string) || (activeCardRec?.image as string) || "";
  const activeCardImg = rawCardFile ? imageUrl(rawCardFile) : "";

  const sectionImg = imageUrl(
    Array.isArray(section.fileUrls) ? section.fileUrls[0] : (section.fileUrl as string) || ""
  );

  const fallbackCourseImg = DEFAULT_COURSE_IMAGES[activeIndex % DEFAULT_COURSE_IMAGES.length] || "/assets/Album/PrePrimary.webp";

  const currentImage =
    activeCardImg ||
    sectionImg ||
    fallbackCourseImg;

  const activeCardTitle = text(
    (activeCardRec?.title || activeCardRec?.heading || activeCardRec?.name) as unknown
  );
  const currentTitle = activeCardTitle || text(section.heading, "Our Courses");

  return (
    <section className="surface-navy relative overflow-hidden py-20 lg:py-32">
      <div className="container-page relative">
        <SectionHeading
          eyebrow="Academic Stages"
          title={text(section.heading, "Our Courses")}
          description={textList(section.description)[0] || "Explore our comprehensive CBSE curriculum across all key educational stages."}
          tone="dark"
        />

        <div className="mt-14 grid items-stretch gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Picture Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: EASE }}
            className="group relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-navy-foreground/15 bg-navy-foreground/5 shadow-2xl lg:col-span-5"
          >
            <div className="relative h-full min-h-[340px] w-full flex-1 overflow-hidden aspect-[4/3] lg:aspect-auto">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImage}
                  src={currentImage}
                  alt={currentTitle}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.5, ease: EASE }}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = fallbackCourseImg;
                  }}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="absolute bottom-5 left-5 right-5 flex flex-col gap-1 text-white">
                <span className="inline-flex max-w-fit items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-[11px] font-bold text-black shadow-sm uppercase tracking-wider">
                  Level {String(activeIndex + 1).padStart(2, "0")}
                </span>
                <h4 className="font-display text-xl font-bold text-white drop-shadow-sm">
                  {currentTitle}
                </h4>
              </div>
            </div>
          </motion.div>

          {/* Cards List Section */}
          <motion.ul
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={{ show: { transition: { staggerChildren: 0.1 } } }}
            className="space-y-3.5 lg:col-span-7 flex flex-col justify-between"
          >
            {cards.map((c, i) => {
              const isActive = i === activeIndex;
              const rec = c as Record<string, unknown>;
              const cardTitle = text((rec.title || rec.heading || rec.name) as unknown);
              const cardDesc = text(c.description);

              return (
                <motion.li
                  key={`${cardTitle}-${i}`}
                  variants={{
                    hidden: { opacity: 0, x: 24 },
                    show: {
                      opacity: 1,
                      x: 0,
                      transition: { duration: 0.5, ease: EASE },
                    },
                  }}
                  onClick={() => setActiveIndex(i)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`group relative cursor-pointer overflow-hidden rounded-2xl border p-5 transition-all duration-300 ${
                    isActive
                      ? "border-gold bg-navy-foreground/15 shadow-lg translate-x-1"
                      : "border-navy-foreground/15 bg-navy-foreground/5 hover:border-navy-foreground/30 hover:bg-navy-foreground/10"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span
                      className={`grid size-9 shrink-0 place-items-center rounded-xl font-display text-sm font-bold transition-colors ${
                        isActive
                          ? "bg-gold text-black"
                          : "bg-navy-foreground/10 text-navy-foreground group-hover:bg-gold/20 group-hover:text-gold"
                      }`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>

                    <div className="flex-1">
                      {cardTitle ? (
                        <h3
                          className={`text-base sm:text-lg font-semibold transition-colors ${
                            isActive ? "text-gold" : "text-navy-foreground"
                          }`}
                        >
                          {cardTitle}
                        </h3>
                      ) : null}
                      <p className={`text-xs sm:text-sm leading-relaxed text-navy-foreground/75 line-clamp-2 ${cardTitle ? "mt-1.5" : ""}`}>
                        {cardDesc}
                      </p>
                    </div>
                  </div>

                  {isActive && (
                    <motion.div
                      layoutId="activeCardIndicator"
                      className="absolute left-0 top-0 bottom-0 w-1.5 bg-gold rounded-r-full"
                    />
                  )}
                </motion.li>
              );
            })}
          </motion.ul>
        </div>
      </div>
    </section>
  );
}
