import { motion } from "motion/react";
import { Clock, Mail, MapPin, Navigation, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/site/Reveal";
import { EASE } from "@/lib/motion-presets";
import { DEFAULT_MAP_DIRECTIONS_URL, getMapEmbedUrl, getOfficeTimingsList, text } from "@/lib/site-data";
import { formatHref, isExternalUrl } from "@/lib/utils";
import { useSiteData } from "@/components/site/SiteDataProvider";

const DETAILS = [
  {
    icon: MapPin,
    label: "Campus Address",
    value: "[School address placeholder]",
    note: "To be confirmed by the school office",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "[Phone number placeholder]",
    note: "Mon–Sat, office hours",
  },
  {
    icon: Mail,
    label: "Email",
    value: "[Email address placeholder]",
    note: "Admissions & general enquiries",
  },
  {
    icon: Clock,
    label: "Office Hours",
    value: "[Timing placeholder]",
    note: "Campus visits by appointment",
  },
];

export function Contact() {
  const siteData = useSiteData();
  const footerConfig = (siteData.footer as Record<string, unknown>) ?? {};
  const contact = (siteData["contact-us"] as Record<string, unknown>) ?? {};
  const address = (contact.Address as Record<string, unknown>) ?? {};
  const fallbackAddress = [address.address, address.district, address.state, address["Post-Office"]].map((value) => text(value)).filter(Boolean).join(", ");
  const fallbackPhone = Array.isArray(contact.phone) ? text(contact.phone[0]) : text(contact.phone);

  const officeTimings = getOfficeTimingsList(contact, footerConfig);

  const addressText = text(footerConfig.address) || fallbackAddress || "Main Road, Near RMC, Khetrajpur, Sambalpur, Odisha - 768006";
  const phone = text(footerConfig.phone) || fallbackPhone || "+91 8114320555";
  const emailText = text(footerConfig.email) || text(contact.email) || "info@indianpublicschool.in";

  const mapEmbedUrl = getMapEmbedUrl(contact);
  const rawMapLink = text(contact["google-map-link"]);
  const mapLink = rawMapLink
    ? formatHref(rawMapLink, DEFAULT_MAP_DIRECTIONS_URL)
    : DEFAULT_MAP_DIRECTIONS_URL;
  return (
    <section id="contact" className="py-20 lg:py-32">
      <div className="container-page">
        <SectionHeading
          eyebrow="Contact"
          title="Visit us, call us, write to us"
          description={text(contact.title, "Contact the Indian Public School office")}
        />

        <div className="mt-14 grid gap-8 lg:grid-cols-2 lg:gap-12">
          <motion.ul
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={{ show: { transition: { staggerChildren: 0.09 } } }}
            className="grid gap-4 sm:grid-cols-2"
          >
            {[
              { ...DETAILS[0], value: addressText, note: text(address.name, "Indian Public School") },
              { ...DETAILS[1], value: phone, note: "School office" },
              { ...DETAILS[2], value: emailText, note: "Admissions & general enquiries" },
              {
                ...DETAILS[3],
                value: (
                  <div className="mt-1 space-y-1">
                    {officeTimings.map((item) => (
                      <div key={item.days} className="flex flex-wrap items-baseline justify-between gap-x-2 text-sm font-semibold">
                        <span className="text-xs text-muted-foreground font-medium">{item.days}:</span>
                        <span className="text-foreground font-bold">{item.hours}</span>
                      </div>
                    ))}
                  </div>
                ),
                note: "Campus visits by appointment",
              },
            ].map(({ icon: Icon, label, value, note }) => (
              <motion.li
                key={label}
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
                }}
                className="rounded-2xl border border-border bg-card p-6 shadow-soft"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
                  <Icon className="size-5" />
                </span>
                <p className="mt-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  {label}
                </p>
                {typeof value === "string" ? (
                  <p className="mt-1 text-base font-semibold">{value}</p>
                ) : (
                  value
                )}
                <p className="mt-1 text-xs text-muted-foreground">{note}</p>
              </motion.li>
            ))}
            <li className="sm:col-span-2 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="rounded-full">
              <a href={phone ? `tel:${phone.replace(/[^+\d]/g, "")}` : "#enquiry"}>
                  <Phone className="mr-1 size-4" /> Call School
                </a>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
              <a href={emailText ? `mailto:${emailText}` : "#enquiry"}>
                  <Mail className="mr-1 size-4" /> Email Us
                </a>
              </Button>
              {(() => {
                const isExternal = isExternalUrl(mapLink);
                return (
                  <Button asChild variant="secondary" className="rounded-full">
                    <a
                      href={mapLink}
                      target={isExternal ? "_blank" : undefined}
                      rel={isExternal ? "noopener noreferrer" : undefined}
                    >
                      <Navigation className="mr-1 size-4" /> Get Directions
                    </a>
                  </Button>
                );
              })()}
            </li>
          </motion.ul>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="relative min-h-[320px] overflow-hidden rounded-3xl border border-border bg-secondary/60 shadow-soft"
          >
            {mapEmbedUrl ? (
              <iframe
                src={mapEmbedUrl}
                title="Indian Public School campus location"
                className="absolute inset-0 size-full border-0"
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            ) : (
              <>
                <div
                  className="absolute inset-0 opacity-60"
                  style={{
                    backgroundImage:
                      "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
                    backgroundSize: "48px 48px",
                  }}
                  aria-hidden
                />
                <div className="relative flex h-full min-h-[320px] flex-col items-center justify-center gap-3 p-8 text-center">
                  <span className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground">
                    <MapPin className="size-5" />
                  </span>
                  <p className="text-lg font-semibold">{addressText}</p>
                  <p className="max-w-xs text-sm text-muted-foreground">
                    {text(contact["google-map-link"], "Campus location available from the school office.")}
                  </p>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
