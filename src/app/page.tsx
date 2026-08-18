import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Hero,
  HowItWorks,
  FeaturedStudents,
  ImpactNumbers,
  Testimonials,
  ClosingCTA,
} from "@/components/landing/sections";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <FeaturedStudents />
        <ImpactNumbers />
        <Testimonials />
        <ClosingCTA />
      </main>
      <Footer />
    </>
  );
}
