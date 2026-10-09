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

  const missionVisionItems = [
    {
      heading: text(cards[0]?.heading, "Our Mission"),
      description: text(
        cards[0]?.description,
        "To nurture curious, compassionate learners through excellent teaching, strong values and real opportunity for every child."
      ),
      redirectUrl: text(cards[0]?.redirectUrl),
      icoUrl: text(cards[0]?.icoUrl || cards[0]?.imageUrl || cards[0]?.icon || cards[0]?.fileUrl),
      icon: Target,
    },
    {
      heading: text(cards[1]?.heading, "Our Vision"),
      description: text(
        cards[1]?.description,
        "To be a school where academic excellence, character and creativity grow together — preparing students for a changing world."
      ),
      redirectUrl: text(cards[1]?.redirectUrl),
      icoUrl: text(cards[1]?.icoUrl || cards[1]?.imageUrl || cards[1]?.icon || cards[1]?.fileUrl),
      icon: Compass,
    },
  ];

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
    <section id="about" className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-white via-slate-50/50 to-white dark:from-slate-950 dark:to-slate-950 overflow-hidden">
      <div className="container-page grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14 items-center">
        {/* Left Column: Video & Mission/Vision */}
        <div ref={ref} className="lg:col-span-6 flex flex-col gap-4 sm:gap-5">
          {/* Video Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="group relative overflow-hidden bg-slate-950 shadow-xl shadow-slate-900/10 dark:border-slate-800"
            style={{ borderRadius: "var(--card-radius, 1.75rem)", border: "1px solid var(--border, rgba(226, 232, 240, 0.8))" }}
          >
            <UniversalMedia
              src={videoSource}
              type="video"
              alt={text(secVid.title || section.heading || "IPS Intro Video")}
              title={text(secVid.title || section.heading || "Experience life at Indian Public School")}
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

          {/* Our Mission & Our Vision divided cards below video */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {missionVisionItems.map((item, i) => {
              const IconComponent = item.icon;
              const content = (
                <div
                  key={`${item.heading}-${i}`}
                  className="group relative p-4 sm:p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 flex flex-col justify-between h-full"
                  style={{
                    borderRadius: "var(--card-radius, 1.25rem)",
                    background: "var(--card, #ffffff)",
                    border: "1px solid var(--border, rgba(226, 232, 240, 0.8))",
                  }}
                >
                  <div>
                    <div className="flex items-center gap-3 mb-2.5">
                      <span
                        className="grid size-10 place-items-center rounded-xl transition-all duration-300 group-hover:scale-105 shrink-0 overflow-hidden"
                        style={{
                          background: "var(--gold-soft, rgba(244, 189, 79, 0.15))",
                          color: "var(--primary, #102a4c)",
                        }}
                      >
                        {item.icoUrl ? (
                          <img src={imageUrl(item.icoUrl)} alt="" className="size-6 object-contain" />
                        ) : (
                          <IconComponent className="size-5" />
                        )}
                      </span>
                      <h3 className="text-base font-bold text-foreground dark:text-slate-100 font-[var(--font-display)]">
                        {item.heading}
                      </h3>
                    </div>
                    <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {item.description}
                    </p>
                  </div>
                </div>
              );

              return item.redirectUrl ? (
                <a key={i} href={item.redirectUrl} className="block h-full">
                  {content}
                </a>
              ) : (
                <div key={i} className="h-full">
                  {content}
                </div>
              );
            })}
          </motion.div>
        </div>

        {/* Right Column: About Content */}
        <div className="lg:col-span-6 flex flex-col justify-center">
          <Reveal>
            <div
              className="inline-flex items-center gap-2.5 px-3.5 py-1 text-xs font-extrabold tracking-wider uppercase backdrop-blur-md shadow-sm border text-[var(--navy)] dark:text-[var(--gold)]"
              style={{
                borderRadius: "var(--badge-radius, 9999px)",
                background: "var(--gold-soft, rgba(244, 189, 79, 0.15))",
                borderColor: "var(--gold, #f4bd4f)",
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--gold, #f4bd4f)" }} />
              {text(section.heading, "About Our School")}
            </div>

            <h2
              className="mt-4 text-3xl font-extrabold leading-[1.15] text-foreground dark:text-slate-100 sm:text-4xl lg:text-5xl font-[var(--font-display)]"
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

          <Reveal delay={0.2}>
            {(() => {
              const rawStoryUrl = text((section.btnLinkText as Record<string, unknown> | undefined)?.url);
              const cleanStoryUrl = rawStoryUrl ? toCleanRelativeAssetPath(rawStoryUrl) : "/about/school-establishment";
              return (
                <Button
                  asChild
                  size="lg"
                  className="group mt-8 text-white px-7 shadow-lg transition-all duration-300 hover:opacity-90 hover:scale-[1.02] self-start"
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


