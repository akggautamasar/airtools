import { MainLayout } from "@/components/layout/main-layout";
import { Hero } from "@/components/home/hero";
import { Features } from "@/components/home/features";
import { ToolCategories } from "@/components/home/tool-categories";
import { PopularTools } from "@/components/home/popular-tools";
import { FAQ } from "@/components/home/faq";
import { CTABanner } from "@/components/home/cta-banner";

export default function HomePage() {
  return (
    <MainLayout>
      <Hero />
      <Features />
      <ToolCategories />
      <PopularTools />
      <FAQ />
      <CTABanner />
    </MainLayout>
  );
}
