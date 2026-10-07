import { motion } from "motion/react";
import Image from "next/image";
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

const FALLBACK_HEIGHTS = [
  "h-72 sm:h-96",
  "h-56 sm:h-64",
  "h-56 sm:h-72",
  "h-72 sm:h-80",
  "h-56 sm:h-64",
  "h-64 sm:h-80",
];

const DEFAULT_STUDENT_LIFE_IMAGES: Record<string, string> = {
  ClassRoom: "/assets/Album/ClassRoom.webp",
  ComputerLab: "/assets/Album/ComputerLab.webp",
  Library: "/assets/Album/Library.webp",
  LifeArts: "/assets/Album/LifeArts.png",
  LifeKids: "/assets/Album/LifeKids.jpg",
  Sports: "/assets/Album/Sports.png",
};

export function StudentLife() {
  const section = firstSection(homeData(useSiteData()), "section-7");
  const shots = Array.isArray(section.cardItem)
    ? (section.cardItem as Record<string, unknown>[])
    : [];

  return (
    <section id="student-life" className="py-20 lg:py-32">
      <div className="container-page">
        <SectionHeading
          eyebrow={text(section.heading) || "Student Life"}
          title={text(section.mainHeading)}
          description={textList(section.description)[0]}
        />
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          className="mt-14 columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4"
        >
          {shots.map((shot, index) => {
            const titleKey = text(shot.title) || text(shot.heading) || "";
            const alt = titleKey || "Student life at Indian Public School";
            const rawUrl = text(shot.fileUrl);
            const fallbackImg = DEFAULT_STUDENT_LIFE_IMAGES[titleKey] || Object.values(DEFAULT_STUDENT_LIFE_IMAGES)[index % 6] || "/assets/Album/ClassRoom.webp";
            const shotImage = (rawUrl ? imageUrl(rawUrl) : "") || fallbackImg;
            return (
              <motion.figure
                key={`${alt}-${index}`}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.7, ease: EASE },
                  },
                }}
                className={`group relative ${FALLBACK_HEIGHTS[index % FALLBACK_HEIGHTS.length]} break-inside-avoid overflow-hidden rounded-3xl shadow-soft`}
              >
                <img
                  src={shotImage}
                  alt={alt}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = fallbackImg;
                  }}
                  className="size-full object-cover transition-transform duration-[900ms] group-hover:scale-105"
                />
                <figcaption className="absolute inset-0 flex items-end bg-gradient-to-t from-navy-deep/80 to-transparent p-5 text-sm font-medium text-navy-foreground opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  {alt}
                </figcaption>
              </motion.figure>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
