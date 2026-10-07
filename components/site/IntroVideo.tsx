import { SectionHeading } from "@/components/site/Reveal";
import { firstSection, homeData, imageUrl, text, DEFAULT_INTRO_VIDEO } from "@/lib/site-data";
import { useSiteData } from "@/components/site/SiteDataProvider";
import { UniversalMedia } from "@/components/ui/UniversalMedia";

export function IntroVideo() {
  const siteHome = homeData(useSiteData());
  const secVid = firstSection(siteHome, "section-video");
  const sec8 = firstSection(siteHome, "section-8");

  let rawUrl = text(secVid.introFileUrl || secVid.videoUrl || sec8.introFileUrl || sec8.videoUrl);
  if (!rawUrl || rawUrl === "/IPSIntroVideo.mp4" || rawUrl.includes("v1789299171")) {
    rawUrl = DEFAULT_INTRO_VIDEO;
  }
  const isCleared = secVid.introFileUrl === "" || secVid.videoUrl === "" || sec8.introFileUrl === "";
  const sourcePath = rawUrl ? rawUrl : isCleared ? "" : DEFAULT_INTRO_VIDEO;
  const source = imageUrl(sourcePath);

  if (!source) {
    return null;
  }

  const eyebrow = text(secVid.eyebrow) || text(sec8.videoEyebrow) || "Discover IPS";
  const title = text(secVid.title || secVid.heading) || text(sec8.videoTitle) || "Experience life at Indian Public School";
  const description = text(secVid.description) || text(sec8.videoDescription) || "Take a look at the campus, learning spaces and student life.";

  const autoPlay = typeof secVid.autoPlay === "boolean" ? secVid.autoPlay : (typeof sec8.autoPlay === "boolean" ? sec8.autoPlay : true);
  const loop = typeof secVid.loop === "boolean" ? secVid.loop : (typeof sec8.loop === "boolean" ? sec8.loop : true);
  const muted = typeof secVid.muted === "boolean" ? secVid.muted : (typeof sec8.muted === "boolean" ? sec8.muted : true);
  const showControls = typeof secVid.controls === "boolean" ? secVid.controls : (typeof sec8.controls === "boolean" ? sec8.controls : true);
  const poster = imageUrl(secVid.poster || sec8.poster || secVid.posterUrl || sec8.posterUrl);

  return (
    <section className="py-20 lg:py-32">
      <div className="container-page">
        <SectionHeading eyebrow={eyebrow} title={title} description={description} />
        <div className="mt-12 overflow-hidden rounded-3xl border border-border bg-navy-deep shadow-lift">
          <UniversalMedia
            src={source}
            alt={title}
            title={title}
            poster={poster || undefined}
            autoPlay={autoPlay}
            muted={muted}
            loop={loop}
            controls={showControls}
            aspectRatio="video"
            objectFit="cover"
            className="w-full"
            containerClassName="w-full rounded-3xl"
          />
        </div>
      </div>
    </section>
  );
}


