import { ExperienceMount } from "@/components/experience/ExperienceMount";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { ScrollCues } from "@/components/layout/ScrollCues";
import { SmoothScroll } from "@/components/scroll/SmoothScroll";
import { Capabilities } from "@/components/sections/Capabilities";
import { Faq } from "@/components/sections/Faq";
import { FinalCta } from "@/components/sections/FinalCta";
import { Hero } from "@/components/sections/Hero";
import { Pricing } from "@/components/sections/Pricing";
import { Process } from "@/components/sections/Process";
import { Story } from "@/components/sections/Story";

export default function Home() {
  return (
    <>
      <ExperienceMount />
      <Navbar />
      <ScrollCues />
      <main className="relative z-10">
        <Hero />
        <Story />
        <div id="rest">
          <Capabilities />
          <Process />
          <Pricing />
          <Faq />
        </div>
        <FinalCta />
      </main>
      <div className="relative z-10">
        <Footer />
      </div>
      <SmoothScroll />
    </>
  );
}
