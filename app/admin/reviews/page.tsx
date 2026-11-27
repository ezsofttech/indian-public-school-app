import type { Metadata } from "next";
import { ResourcePageContainer } from "@/components/admin/ResourcePageContainer";

export const metadata: Metadata = {
  title: "Reviews & Feedback | Indian Public School",
  description: "Testimonials and public reviews management",
};

export default function ReviewsPage() {
  return <ResourcePageContainer resourceKey="reviews" />;
}
