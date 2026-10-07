import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { ArrowRight, Compass, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/site/Reveal";
import { UniversalMedia } from "@/components/ui/UniversalMedia";
import { SmartFileThumbnail } from "@/components/ui/SmartFileThumbnail";
import { getAssetUrl, toCleanRelativeAssetPath } from "@/lib/utils";
import {
  firstSection,
  homeData,
  imageUrl,
  text,
  textList,
  DEFAULT_INTRO_VIDEO,
} from "@/lib/site-data";
import { useSiteData } from "@/components/site/SiteDataProvider";

export function About() {
  const siteHome = homeData(useSiteData());
  const section = firstSection(siteHome, "section-1");
  const secVid = firstSection(siteHome, "section-video");
  const sec8 = firstSection(siteHome, "section-8");

  const configuredUrl = text(secVid.introFileUrl || secVid.videoUrl || sec8.introFileUrl || sec8.videoUrl);
  const videoRaw = (configuredUrl && configuredUrl.trim().length > 0 && configuredUrl !== "/IPSIntroVideo.mp4" && !configuredUrl.includes("v1789299171"))
    ? configuredUrl
    : DEFAULT_INTRO_VIDEO;
  const videoSource = imageUrl(videoRaw);

  const descriptions = textList(section.description);
  const cards = Array.isArray(section.cardItem)
    ? (section.cardItem as Record<string, unknown>[])
    : [];
  const brief = Array.isArray(section.briefCard)
    ? (section.briefCard[0] as Record<string, unknown>)
    : {};
  const briefImage = getAssetUrl(brief.fileUrl as string) || "/assets/Album/CampusAerial.png";
  const briefHeading = text(brief.heading, "A green, purpose-built campus for modern learning");
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    ["-4%", reduced ? "-4%" : "4%"],
  );

  return (
    <section id="about" className="py-16 sm:py-20 lg:py-28 bg-gradient-to-b from-white via-slate-50/50 to-white dark:from-slate-950 dark:to-slate-950 overflow-hidden">
      <div className="container-page grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14 items-center">
        {/* Left Column: Video & Campus Card */}
        <div ref={ref} className="lg:col-span-6 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="group relative overflow-hidden bg-slate-950 shadow-2xl shadow-slate-900/15 dark:border-slate-800"
            style={{ borderRadius: "var(--card-radius, 2rem)", border: "1px solid var(--border, rgba(226, 232, 240, 0.8))" }}
          >
            <UniversalMedia
              src={videoSource}
              type="video"
              alt={text(secVid.title || section.heading || "IPS Intro Video")}
              title={text(secVid.title || section.heading || "Experience life at Indian Public School")}
              poster={briefImage || undefined}
              autoPlay={typeof secVid.autoPlay === "boolean" ? secVid.autoPlay : true}
              muted={typeof secVid.muted === "boolean" ? secVid.muted : true}
              loop={typeof secVid.loop === "boolean" ? secVid.loop : true}
              controls={typeof secVid.controls === "boolean" ? secVid.controls : true}
              aspectRatio="video"
              objectFit="cover"
              className="w-full h-full object-cover rounded-[inherit]"
              containerClassName="w-full aspect-video overflow-hidden rounded-[inherit] border-0 shadow-none bg-black"
            />
          </motion.div>

          {/* Sub-card below video to anchor left column */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center gap-4 bg-white dark:bg-slate-900 p-3.5 shadow-sm dark:border-slate-800"
            style={{ borderRadius: "var(--card-radius, 1rem)", border: "1px solid var(--border, rgba(226, 232, 240, 0.7))" }}
          >
            <SmartFileThumbnail
              url={briefImage}
              alt={briefHeading}
              className="h-14 w-20 flex-shrink-0"
              style={{ borderRadius: "calc(var(--card-radius, 1rem) * 0.7)" }}
            />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--gold, #d97706)" }}>
                School Campus
              </p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {briefHeading}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Right Column: About Content */}
        <div className="lg:col-span-6">
          <Reveal>
            <div
              className="inline-flex items-center gap-2.5 px-3.5 py-1 text-xs font-extrabold tracking-wider uppercase backdrop-blur-md shadow-sm border"
              style={{
                borderRadius: "var(--badge-radius, 9999px)",
                background: "var(--gold-soft, rgba(244, 189, 79, 0.15))",
                borderColor: "var(--gold, #f4bd4f)",
                color: "var(--navy, #102a4c)",
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--gold, #f4bd4f)" }} />
              {text(section.heading, "About Our School")}
            </div>

            <h2
              className="mt-4 text-3xl font-extrabold leading-[1.15] dark:text-slate-100 sm:text-4xl lg:text-5xl font-[var(--font-display)]"
              style={{ color: "var(--navy, #102a4c)" }}
            >
              {text(section.subHeading)}
            </h2>

            {descriptions[0] && (
              <p className="mt-5 text-base font-normal leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
                {descriptions[0]}
              </p>
            )}

            {descriptions[1] && (
              <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-400">
                {descriptions[1]}
              </p>
            )}
          </Reveal>

          {/* Cards Section */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {cards.map((card, i) => {
              const Icon = i === 0 ? Target : Compass;
              const title = text(card.heading);
              const redirectUrl = text(card.redirectUrl);
              return (
                <Reveal key={`${title || "about-card"}-${i}`} delay={0.1 * i}>
                  <a
                    href={redirectUrl || undefined}
                    className="group block h-full p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800"
                    style={{
                      borderRadius: "var(--card-radius, 1rem)",
                      background: "var(--card, #ffffff)",
                      border: "1px solid var(--border, rgba(226, 232, 240, 0.8))",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="grid size-11 place-items-center transition-all group-hover:scale-105"
                        style={{
                          borderRadius: "calc(var(--card-radius, 1rem) * 0.75)",
                          background: "var(--gold-soft, rgba(244, 189, 79, 0.15))",
                          color: "var(--primary, #102a4c)",
                        }}
                      >
                        <Icon className="size-5" />
                      </span>
                      <h3
                        className="text-lg font-bold dark:text-slate-100 font-[var(--font-display)]"
                        style={{ color: "var(--navy, #102a4c)" }}
                      >
                        {title}
                      </h3>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {text(card.description)}
                    </p>
                  </a>
                </Reveal>
              );
            })}
          </div>

          <Reveal delay={0.2}>
            {(() => {
              const rawStoryUrl = text((section.btnLinkText as Record<string, unknown> | undefined)?.url);
              const cleanStoryUrl = rawStoryUrl ? toCleanRelativeAssetPath(rawStoryUrl) : "/about/school-establishment";
              return (
                <Button
                  asChild
                  size="lg"
                  className="group mt-8 text-white px-7 shadow-lg transition-all duration-300 hover:opacity-90 hover:scale-[1.02]"
                  style={{
                    borderRadius: "var(--btn-radius, 9999px)",
                    background: "var(--gradient-navy, var(--navy, #102a4c))",
                  }}
                >
                  <a href={cleanStoryUrl}>
                    {text(
                      (section.btnLinkText as Record<string, unknown> | undefined)
                        ?.text,
                      "Discover Our Story",
                    )}
                    <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </Button>
              );
            })()}
          </Reveal>
        </div>
      </div>
    </section>
  );
}

