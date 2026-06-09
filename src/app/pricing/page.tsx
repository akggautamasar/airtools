import { MainLayout } from "@/components/layout/main-layout";
import { generatePageMetadata } from "@/lib/seo";
import { PricingContent } from "./pricing-content";

export const metadata = generatePageMetadata(
  "Pricing",
  "Simple, transparent pricing. Start free and upgrade when you need more power.",
  "/pricing"
);

export default function PricingPage() {
  return (
    <MainLayout>
      <PricingContent />
    </MainLayout>
  );
}
