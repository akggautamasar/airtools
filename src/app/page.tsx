import { MainLayout } from "@/components/layout/main-layout";
import { Hero } from "@/components/home/hero";
import { Stats } from "@/components/home/stats";
import { Features } from "@/components/home/features";
import { ToolCategories } from "@/components/home/tool-categories";
import { PopularTools } from "@/components/home/popular-tools";
import { Testimonials } from "@/components/home/testimonials";
import { FAQ } from "@/components/home/faq";
import { CTABanner } from "@/components/home/cta-banner";

export default function HomePage() {
  return (
    <MainLayout>
      <Hero />
      <Stats />
      <Features />
      <ToolCategories />
      <PopularTools />
      <Testimonials />
      <FAQ />
      <CTABanner />
    </MainLayout>
  );
}
