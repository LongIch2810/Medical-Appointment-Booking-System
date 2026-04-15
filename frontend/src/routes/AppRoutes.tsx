import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Doctor from "@/pages/Doctor";
import News from "@/pages/News";
import Contact from "@/pages/Contact";
import Chatbot from "@/pages/Chatbot";
import NotFound from "@/pages/NotFound";
import SignIn from "@/pages/SignIn";
import SignUp from "@/pages/SignUp";
import FAQ from "@/pages/FAQ";
import Terms from "@/pages/Terms";
import Feedback from "@/pages/FeedBack";
import Team from "@/pages/Team";
import Careers from "@/pages/Careers";
import ForgotPassword from "@/pages/ForgotPassword";
import Test from "@/pages/Test";
import DoctorDetail from "@/pages/DoctorDetail";
import MainLayout from "@/layouts/MainLayout";
import RouteProtected from "./RouteProtected";
import AICoachHealth from "@/pages/AICoachHealth";
import PatientLayout from "@/layouts/PatientLayout";
import Dashboard from "@/pages/patient/Dashboard";
import Profile from "@/pages/patient/Profile";
import Appointments from "@/pages/patient/Appointments";
import Relatives from "@/pages/patient/Relatives";
import Settings from "@/pages/patient/Settings";
import Messages from "@/pages/patient/Messages";
import HealthRecords from "@/pages/patient/HealthRecords";
import VisitResults from "@/pages/patient/VisitResults";
import Forbidden from "@/pages/Forbidden";

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route path="/" element={<Home />}></Route>
        <Route path="/doctors" element={<Doctor />}></Route>
        <Route path="/contact" element={<Contact />}></Route>
        <Route path="/faq" element={<FAQ />}></Route>
        <Route path="/terms" element={<Terms />}></Route>
        <Route path="/team" element={<Team />}></Route>
        <Route path="/careers" element={<Careers />}></Route>
        <Route path="/forgot-password" element={<ForgotPassword />}></Route>
        <Route path="/test" element={<Test />}></Route>
        <Route element={<RouteProtected />}>
          <Route path="/doctors/:id" element={<DoctorDetail />}></Route>
          <Route path="/feedback" element={<Feedback />}></Route>
          <Route path="/chatbot" element={<Chatbot />}></Route>
          <Route path="/patient" element={<PatientLayout />}>
            <Route index element={<Dashboard />}></Route>
            <Route path="profile" element={<Profile />}></Route>
            <Route path="appointments" element={<Appointments />}></Route>
            <Route path="relatives" element={<Relatives />}></Route>
            <Route path="settings" element={<Settings />}></Route>
            <Route path="messages" element={<Messages />}></Route>
            <Route path="health-records" element={<HealthRecords />}></Route>
            <Route path="visit-results" element={<VisitResults />}></Route>
            <Route path="ai-coach-health" element={<AICoachHealth />}></Route>
          </Route>
        </Route>
      </Route>
      <Route path="/sign-up" element={<SignUp />}></Route>
      <Route path="/sign-in" element={<SignIn />}></Route>
      <Route path="/news" element={<News />}></Route>
      <Route path="/403" element={<Forbidden />}></Route>
      <Route path="*" element={<NotFound />}></Route>
    </Routes>
  );
};

export default AppRoutes;
