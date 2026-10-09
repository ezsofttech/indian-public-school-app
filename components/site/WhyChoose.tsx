import { motion } from "motion/react";
import {
  BookOpenCheck,
  Cpu,
  HeartHandshake,
  Palette,
  ShieldCheck,
  Building2,
  Trophy,
  Users,
  GraduationCap,
  Star,
  Award,
  Sparkles,
  Target,
  Globe,
  Atom,
  BookOpen,
  Lightbulb,
  Compass,
  Rocket,
  CheckCircle2,
  Smile,
  Zap,
} from "lucide-react";
import { SectionHeading } from "@/components/site/Reveal";
import { EASE } from "@/lib/motion-presets";
import { cn } from "@/lib/utils";
import { firstSection, homeData, text, textList } from "@/lib/site-data";
import { useSiteData } from "@/components/site/SiteDataProvider";
import { getAssetUrl } from "@/lib/utils";

const ICON_MAP: Record<string, React.ElementType> = {
  BookOpenCheck,
  Users,
  Cpu,
  Trophy,
  Palette,
  ShieldCheck,
  Building2,
  HeartHandshake,
  GraduationCap,
  Star,
  Award,
  Sparkles,
  Target,
  Globe,
  Atom,
  BookOpen,
  Lightbulb,
  Compass,
  Rocket,
  CheckCircle2,
  Smile,
  Zap,
};

const FEATURES = [
  {
    icon: BookOpenCheck,
    title: "CBSE Curriculum",
    text: "A structured CBSE programme delivered with enquiry-led teaching, continuous assessment and clear learning outcomes.",
    span: "lg:col-span-2 lg:row-span-1",
    feature: true,
  },
  {
    icon: Users,
    title: "Experienced Faculty",
    text: "Subject specialists and mentors who track every child's progress closely.",
  },
  {
    icon: Cpu,
    title: "Technology Enabled Learning",
    text: "Smart boards, digital labs and blended resources in everyday lessons.",
  },
  {
    icon: Trophy,
    title: "Sports & Fitness",
    text: "Athletics, football, cricket, basketball, yoga and structured PE for all ages.",
    span: "lg:col-span-2",
  },
  {
    icon: Palette,
    title: "Arts & Culture",
    text: "Music, dance, theatre and visual arts woven into the weekly timetable.",
  },
  {
    icon: ShieldCheck,
    title: "Safe Campus",
    text: "CCTV coverage, trained staff, medical room and GPS-tracked transport.",
  },
  {
    icon: Building2,
    title: "Modern Infrastructure",
    text: "Airy classrooms, well-equipped labs, library and activity spaces.",
  },
  {
    icon: HeartHandshake,
    title: "Holistic Development",
    text: "Life skills, leadership, service and wellbeing programmes for every stage.",
  },
];

function renderCardIcon(icoVal: string | undefined, FallbackIcon: React.ElementType, isFeature: boolean) {
  if (!icoVal) return <FallbackIcon className="size-5" />;

  const key = String(icoVal).trim();
  if (ICON_MAP[key]) {
    const Component = ICON_MAP[key];
    return <Component className="size-5" />;
  }

  if (key.startsWith("bi-") || key.startsWith("bi ")) {
    return <i className={cn("bi size-5 text-base flex items-center justify-center", key.startsWith("bi-") ? `bi ${key}` : key)} />;
  }

  if (key.startsWith("http") || key.startsWith("/") || key.startsWith("data:") || key.includes(".")) {
    const src = getAssetUrl(key);
    return (
      <img
        src={src}
        alt="icon"
        className="size-6 object-contain brightness-0 opacity-90 transition-all"
        onError={(e) => {
          (e.target as HTMLElement).style.display = "none";
        }}
      />
    );
  }

  return <FallbackIcon className="size-5" />;
}

export function WhyChoose() {
  const section = firstSection(homeData(useSiteData()), "section-3");
  const features = Array.isArray(section.cardItem)
    ? (section.cardItem as Record<string, unknown>[])
    : [];
  const featureCards: Record<string, unknown>[] = features.length
    ? features
    : FEATURES.map((feature) => ({
        heading: feature.title,
        description: feature.text,
      }));
  return (
    <section className="py-20 lg:py-32">
      <div className="container-page">
        <SectionHeading
          eyebrow="Why Choose IPS"
          title={text(section.mainHeading)}
          description={textList(section.description)[0]}
        />

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          variants={{ show: { transition: { staggerChildren: 0.07 } } }}
          className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {featureCards.map((item, index) => {
            const fallback = FEATURES[index % FEATURES.length]!;
            const title = text(item.heading, fallback.title);
            const copy = text(item.description, fallback.text);
            const icoVal = text(item.icoUrl) || text(item.icon) || text(item.iconName) || text(item.fileUrl) || text(item.imageUrl);
            const span = fallback.span;
            const feature = index === 0;
            return (
              <motion.div
                key={`${title}-${index}`}
                variants={{
                  hidden: { opacity: 0, y: 28 },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.6, ease: EASE },
                  },
                }}
                whileHover={{ y: -4 }}
                className={cn(
                  "group relative overflow-hidden rounded-3xl border border-border p-6 shadow-soft transition-shadow hover:shadow-lift sm:p-7",
                  feature ? "surface-navy border-transparent" : "bg-card",
                  span,
                )}
              >
                <span
                  className={cn(
                    "grid size-11 place-items-center rounded-2xl transition-colors",
                    feature
                      ? "bg-gold text-gold-foreground"
                      : "bg-secondary text-primary group-hover:bg-gold group-hover:text-gold-foreground",
                  )}
                >
                  {renderCardIcon(icoVal, fallback.icon, feature)}
                </span>
                <h3
                  className={cn(
                    "mt-5 text-lg sm:text-xl",
                    feature && "text-navy-foreground",
                  )}
                >
                  {title}
                </h3>
                <p
                  className={cn(
                    "mt-2 text-sm leading-relaxed",
                    feature
                      ? "text-navy-foreground/75"
                      : "text-muted-foreground",
                  )}
                >
                  {copy}
                </p>
                <span
                  className="pointer-events-none absolute -right-16 -bottom-16 size-40 rounded-full bg-gold/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                  aria-hidden
                />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
