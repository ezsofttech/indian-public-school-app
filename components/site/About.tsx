"use client";

import { motion } from "motion/react";
import { ArrowRight, Compass, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/site/Reveal";
import { UniversalMedia } from "@/components/ui/UniversalMedia";
import { getAssetUrl, toCleanRelativeAssetPath, formatHref, isExternalUrl } from "@/lib/utils";
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
  const videoRaw = (configuredUrl && configuredUrl.trim().length > 0 && configuredUrl !== "/IPSIntroVideo.mp4" && configuredUrl !== "/Videos/IPSIntroVideo.mp4" && !configuredUrl.includes("v1789299171"))
    ? configuredUrl
    : DEFAULT_INTRO_VIDEO;
  const videoSource = imageUrl(videoRaw);

  const videoTitle = text(
    secVid.title || secVid.heading || sec8.videoTitle,
    "Experience Life at Indian Public School"
  );

  const descriptions = textList(section.description);
  const rawCards = Array.isArray(section.cardItem)
    ? (section.cardItem as Record<string, unknown>[])
    : [];

  const missionVisionItems = rawCards.length > 0
    ? rawCards.map((card, i) => ({
        heading: text(card?.heading, i === 0 ? "Our Mission" : i === 1 ? "Our Vision" : `Card #${i + 1}`),
        description: text(card?.description, ""),
        redirectUrl: text(card?.redirectUrl),
        icoUrl: text(card?.icoUrl || card?.imageUrl || card?.icon || card?.fileUrl),
        icon: i === 0 ? Target : Compass,
      }))
    : [
        {
          heading: "Our Mission",
          description: "To nurture curious, compassionate learners through excellent teaching, strong values and real opportunity for every child.",
          redirectUrl: "",
          icoUrl: "",
          icon: Target,
        },
        {
          heading: "Our Vision",
          description: "To be a school where academic excellence, character and creativity grow together — preparing students for a changing world.",
          redirectUrl: "",
          icoUrl: "",
          icon: Compass,
        },
      ];

  const btnLinkObj = section.btnLinkText as Record<string, unknown> | undefined;
  const isBtnEnabled = btnLinkObj ? btnLinkObj.show !== false : true;
  const storyBtnText = text(btnLinkObj?.text, "Discover Our Story");
  const rawStoryUrl = text(btnLinkObj?.url);
  const cleanStoryUrl = rawStoryUrl ? formatHref(rawStoryUrl, "/about/school-establishment") : "/about/school-establishment";
  const isStoryExternal = isExternalUrl(cleanStoryUrl);
  const showStoryBtn = isBtnEnabled && !!storyBtnText && storyBtnText.trim().length > 0;

  return (
    <section id="about" className="py-8 sm:py-10 lg:py-12 bg-background overflow-hidden">
      <div className="container-page">
        {/* Main 2-Column Row: Left Video Media & Right About Story with Mission/Vision (Fits on ONE single screen without scrolling!) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 xl:gap-10 items-center">
          {/* Left Column: Picture / Video Showcase with Main Title Above Video */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <Reveal>
              {/* Main Title Above Video */}
              <div className="mb-3 sm:mb-3.5">
                <h3 className="font-display font-bold text-foreground text-xl sm:text-2xl lg:text-[1.85rem] tracking-tight leading-[1.2]">
                  {videoTitle}
                </h3>

                {/* Signature decorative accent line */}
                <div className="mt-2.5 flex items-center gap-1.5" aria-hidden>
                  <span className="h-1 w-10 rounded-full bg-primary" />
                  <span className="h-1 w-2.5 rounded-full bg-gold" />
                </div>
              </div>
            </Reveal>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border bg-card shadow-lift"
            >
              <UniversalMedia
                src={videoSource}
                type="video"
                alt={videoTitle}
                title={videoTitle}
                autoPlay={typeof secVid.autoPlay === "boolean" ? secVid.autoPlay : true}
                muted={typeof secVid.muted === "boolean" ? secVid.muted : true}
                loop={typeof secVid.loop === "boolean" ? secVid.loop : true}
                controls={typeof secVid.controls === "boolean" ? secVid.controls : true}
                aspectRatio="video"
                objectFit="cover"
                className="w-full h-full object-cover"
                containerClassName="w-full aspect-video overflow-hidden border-0 shadow-none bg-black"
              />
            </motion.div>
          </div>

          {/* Right Column: About Heading, Story, Mission/Vision Cards & CTA Button */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <Reveal>
              {/* Eyebrow Tagline - 100% Consistent with other site sections */}
              <span className="eyebrow text-primary">
                <span className="h-px w-8 bg-gold" aria-hidden />
                {text(section.heading, "About Our School")}
              </span>

              {/* Main Heading - 100% Consistent font-display and text-foreground */}
              <h2 className="mt-2 text-2xl sm:text-3xl lg:text-[1.85rem] font-display font-bold text-foreground tracking-tight leading-[1.2]">
                {text(section.subHeading)}
              </h2>

              {/* Signature decorative accent line */}
              <div className="mt-2.5 flex items-center gap-1.5" aria-hidden>
                <span className="h-1 w-10 rounded-full bg-primary" />
                <span className="h-1 w-2.5 rounded-full bg-gold" />
              </div>

              {/* Description Paragraphs - Render all paragraphs from DB */}
              {descriptions.length > 0 ? (
                descriptions.map((desc, dIdx) => (
                  <p key={dIdx} className="mt-2.5 text-xs sm:text-sm font-sans font-normal leading-relaxed text-muted-foreground">
                    {desc}
                  </p>
                ))
              ) : (
                <p className="mt-3 text-xs sm:text-sm font-sans font-normal leading-relaxed text-muted-foreground">
                  Indian Public School is a co-educational CBSE school where academic rigour meets genuine care. Our classrooms are designed for enquiry rather than repetition, and our teachers know every child by name, strength and ambition.
                </p>
              )}
            </Reveal>

            {/* Mission & Vision Cards inside Right Column with Design System Tokens */}
            <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {missionVisionItems.map((item, i) => {
                const IconComponent = item.icon;
                const isMission = i === 0;
                return (
                  <div
                    key={`${item.heading}-${i}`}
                    className="group relative overflow-hidden rounded-2xl border border-border bg-card p-3.5 sm:p-4 shadow-soft hover:shadow-lift transition-all duration-300 hover:-translate-y-0.5"
                  >
                    {/* Subtle decorative corner accent using theme colors */}
                    <div
                      className={`absolute top-0 right-0 h-16 w-16 rounded-bl-full opacity-10 transition-transform duration-300 group-hover:scale-125 ${
                        isMission ? "bg-gold" : "bg-primary"
                      }`}
                    />

                    <div className="flex items-start gap-2.5 sm:gap-3">
                      {/* Icon container matching WhyChoose card icon styles */}
                      <div
                        className={`grid size-9 sm:size-10 place-items-center rounded-xl shrink-0 transition-transform duration-300 group-hover:scale-105 shadow-xs ${
                          isMission
                            ? "bg-gold/15 text-gold-foreground border border-gold/30 dark:bg-gold/20 dark:text-gold"
                            : "bg-secondary text-primary border border-border group-hover:bg-primary group-hover:text-primary-foreground"
                        }`}
                      >
                        {item.icoUrl ? (
                          <img src={imageUrl(item.icoUrl)} alt="" className="size-4.5 sm:size-5 object-contain" />
                        ) : (
                          <IconComponent className="size-4.5 sm:size-5" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-bold text-foreground text-sm sm:text-base leading-snug">
                          {item.heading}
                        </h3>
                        <p className="mt-1 font-sans text-[11px] sm:text-xs leading-relaxed text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Discover Our Story Action Button with variant="navy" */}
            {showStoryBtn && (
              <div className="mt-3.5 flex items-center justify-start">
                <Button
                  asChild
                  variant="navy"
                  size="default"
                  className="group rounded-full shadow-soft hover:shadow-lift transition-all duration-300 text-xs font-bold px-5 py-2"
                >
                  <a
                    href={cleanStoryUrl}
                    target={isStoryExternal ? "_blank" : undefined}
                    rel={isStoryExternal ? "noopener noreferrer" : undefined}
                    className="flex items-center gap-2"
                  >
                    <span>{storyBtnText}</span>
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}


