import { motion } from "motion/react";
import { SectionHeading } from "@/components/site/Reveal";
import { EASE } from "@/lib/motion-presets";
import { cn } from "@/lib/utils";
import {
  firstSection,
  homeData,
  imageUrl,
  text,
  textList,
} from "@/lib/site-data";
import { useSiteData } from "@/components/site/SiteDataProvider";

const FACILITIES = [
  {
    title: "Smart Classrooms",
    text: "Digital boards and airy, light-filled rooms.",
    img: "",
    span: "sm:col-span-2 sm:row-span-2",
  },
  {
    title: "Science Labs",
    text: "Physics, chemistry and biology labs.",
    img: "",
  },
  {
    title: "Computer Lab",
    text: "Modern workstations for coding and design.",
    img: "",
  },
  {
    title: "Library",
    text: "Reading room with a growing collection.",
    img: "",
    span: "sm:col-span-2",
  },
  {
    title: "Sports Facilities",
    text: "Courts, track and coached team practice.",
    img: "",
  },
  { title: "Playground", text: "Safe, age-appropriate play zones.", img: "" },
  {
    title: "Hostel & Mess",
    text: "Supervised residence with nutritious dining.",
    img: "",
  },
  {
    title: "Art & Music Rooms",
    text: "Dedicated studios for creative practice.",
    img: "",
  },
];

const DEFAULT_FACILITY_MAP: Record<string, string> = {
  "Smart Classrooms": "/assets/Album/ClassRoom.webp",
  "Science Labs": "/assets/Album/ScienceLab.webp",
  "Computer Lab": "/assets/Album/ComputerLab.webp",
  "Library": "/assets/Album/Library.webp",
  "Sports Facilities": "/assets/Album/Sports.png",
  "Playground": "/assets/Album/KidPlaygroud_1.jpg",
  "Hostel & Mess": "/assets/Album/Mess_1.jpg",
  "Art & Music Rooms": "/assets/Album/LifeArts.png",
};

export function Infrastructure() {
  const section = firstSection(homeData(useSiteData()), "section-6");
  const facilities = Array.isArray(section.cardItem)
    ? (section.cardItem as Record<string, unknown>[])
    : [];
  const facilityCards: Record<string, unknown>[] = facilities.length
    ? facilities
    : FACILITIES.map((facility) => ({
        heading: facility.title,
        description: facility.text,
        fileUrl: "",
      }));
  return (
    <section id="infrastructure" className="bg-secondary/40 py-20 lg:py-32">
      <div className="container-page">
        <SectionHeading
          eyebrow="Campus & Infrastructure"
          title={text(section.mainHeading)}
          description={textList(section.description)[0]}
        />

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          className="mt-14 grid auto-rows-[200px] grid-cols-1 gap-4 sm:grid-cols-4 sm:auto-rows-[190px]"
        >

          {facilityCards.map((f, index) => {
            const fallback = FACILITIES[index % FACILITIES.length]!;
            const title = text(f.heading, fallback.title);
            const redirectUrl = text(f.redirectUrl);
            const rawUrl = text(f.fileUrl);
            const facilityImage = (rawUrl ? imageUrl(rawUrl) : "") || DEFAULT_FACILITY_MAP[title] || "/assets/Album/ClassRoom.webp";
            return (
              <motion.a
                key={`${title}-${index}`}
                href={redirectUrl || undefined}
                variants={{
                  hidden: { opacity: 0, scale: 0.96 },
                  show: {
                    opacity: 1,
                    scale: 1,
                    transition: { duration: 0.7, ease: EASE },
                  },
                }}
                className={cn(
                  "group relative overflow-hidden rounded-3xl shadow-soft",
                  fallback.span,
                )}
              >
                <img
                  src={facilityImage}
                  alt={title}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = DEFAULT_FACILITY_MAP[title] || "/assets/Album/ClassRoom.webp";
                  }}
                  className="size-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-navy-deep/90 via-navy-deep/25 to-transparent"
                  aria-hidden
                />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="text-lg text-navy-foreground">{title}</h3>
                  <p className="mt-1 max-h-0 overflow-hidden text-sm text-navy-foreground/80 opacity-0 transition-all duration-500 group-hover:max-h-20 group-hover:opacity-100">
                    {text(f.description, fallback.text)}
                  </p>
                </div>
              </motion.a>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
