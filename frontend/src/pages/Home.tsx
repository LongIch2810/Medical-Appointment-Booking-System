import React, { lazy } from "react";
// Above-the-fold & light sections: Eager imports for instantaneous rendering and early query execution
import HeroSection from "@/components/section/HeroSection";
import TrustStripSection from "@/components/section/TrustStripSection";
import SpecialtiesSection from "@/components/section/SpecialtiesSection";
import OutstandingDoctorsSection from "@/components/section/OutstandingDoctorsSection";
import BookingProcessSection from "@/components/section/BookingProcessSection";
import InspireAndShareLoveSection from "@/components/section/InspireAndShareLoveSection";
import DataSecuritySection from "@/components/section/DataSecuritySection";

import LazyViewport from "@/components/lazy/LazyViewport";
import SectionSkeleton from "@/components/lazy/SectionSkeleton";

// Heavy below-the-fold content: Isolates Lottie animation runtime until scrolled near viewport
const AiHealthcareAssistantSection = lazy(
  () => import("@/components/section/AiHealthcareAssistantSection")
);

const Home: React.FC = () => {
  return (
    <main className="mt-16 lg:mt-24 min-h-screen bg-white dark:bg-[#0B1220] text-slate-900 dark:text-[#F1F5F9]">
      {/* 1. Hero with Asymmetric Layout, Care Path Heartbeat & Preview Card */}
      <HeroSection />

      {/* 2. Trust Strip with 3 Core Verified Commitments */}
      <TrustStripSection />

      {/* 3. Popular Specialties Grid */}
      <SpecialtiesSection />

      {/* 4. Outstanding Doctors from Real API */}
      <OutstandingDoctorsSection />

      {/* 5. 3-Step Booking Process */}
      <BookingProcessSection />

      {/* 6. AI Healthcare Assistant (Isolates Lottie & JSON bundle until near viewport) */}
      <LazyViewport
        minHeight={480}
        rootMargin="150px 0px"
        fallback={
          <SectionSkeleton
            minHeight={480}
            title="Trợ lý y tế thông minh (AI Healthcare)"
            description="Định hướng triệu chứng & Hỗ trợ chăm sóc sức khỏe 24/7."
            type="simple"
          />
        }
      >
        <AiHealthcareAssistantSection />
      </LazyViewport>

      {/* 7. Community Care & Charity Activities */}
      <InspireAndShareLoveSection />

      {/* 8. Data Security & Closing CTA */}
      <DataSecuritySection />
    </main>
  );
};

export default Home;

