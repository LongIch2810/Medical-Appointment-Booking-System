import React from "react";
import SpecialtiesSection from "@/components/section/SpecialtiesSection";
import { InspireAndShareLoveSection } from "@/components/section/InspireAndShareLoveSection";
import OutstandingDoctorsSection from "@/components/section/OutstandingDoctorsSection";
import BannerSection from "@/components/section/BannerSection";
import SloganSection from "@/components/section/SloganSection";
import FeelFreeFindAndBookDoctorSection from "@/components/section/FeelFreeFindAndBookDoctorSection";
import { useUserStore } from "@/store/useUserStore";
import FindAndBookDoctorSection from "../components/section/FindAndBookDoctorSection";
import AiHealthcareAssistantSection from "../components/section/AiHealthcareAssistantSection";
import DataSecuritySection from "../components/section/DataSecuritySection";

const Home: React.FC = () => {
  const { userInfo } = useUserStore();
  console.log(">>> userInfo : ", userInfo);
  return (
    <section className="mt-16 md:mt-28">
      {/*Banner */}
      <BannerSection />

      {/*Slogan*/}
      <SloganSection />
      <div className="flex flex-col gap-y-10 md:gap-y-20">
        {/*Inspire And Share Love */}
        <InspireAndShareLoveSection />

        {/*Carousel*/}
        <OutstandingDoctorsSection />

        {/*Specialties*/}
        <SpecialtiesSection />

        {/*Find and book doctor */}
        <FindAndBookDoctorSection />

        {/*AI Application in Health Care */}
        <AiHealthcareAssistantSection />

        {/*Feel free to search for and book a doctor.*/}
        <FeelFreeFindAndBookDoctorSection />

        {/*Data security */}
        <DataSecuritySection />
      </div>
    </section>
  );
};

export default Home;
