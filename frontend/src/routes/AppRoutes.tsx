import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import MainLayout from "@/layouts/MainLayout";
import RouteProtected from "./RouteProtected";
import PatientLayout from "@/layouts/PatientLayout";
import RouteLoadingFallback from "@/components/common/RouteLoadingFallback";

// Route-level code-splitting: Dynamic imports via React.lazy
const Doctor = lazy(() => import("@/pages/Doctor"));
const DoctorDetail = lazy(() => import("@/pages/DoctorDetail"));
const News = lazy(() => import("@/pages/News"));
const NewsDetail = lazy(() => import("@/pages/NewsDetail"));
const Contact = lazy(() => import("@/pages/Contact"));
const Chatbot = lazy(() => import("@/pages/Chatbot"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const SignIn = lazy(() => import("@/pages/SignIn"));
const SignUp = lazy(() => import("@/pages/SignUp"));
const FAQ = lazy(() => import("@/pages/FAQ"));
const Terms = lazy(() => import("@/pages/Terms"));
const Feedback = lazy(() => import("@/pages/FeedBack"));
const Team = lazy(() => import("@/pages/Team"));
const Careers = lazy(() => import("@/pages/Careers"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const Test = lazy(() => import("@/pages/Test"));
const Forbidden = lazy(() => import("@/pages/Forbidden"));

// Patient Portal Pages (Code-split into dedicated patient bundle)
const Dashboard = lazy(() => import("@/pages/patient/Dashboard"));
const Profile = lazy(() => import("@/pages/patient/Profile"));
const Appointments = lazy(() => import("@/pages/patient/Appointments"));
const Notifications = lazy(() => import("@/pages/patient/Notifications"));
const Relatives = lazy(() => import("@/pages/patient/Relatives"));
const Settings = lazy(() => import("@/pages/patient/Settings"));
const Messages = lazy(() => import("@/pages/patient/Messages"));
const HealthRecords = lazy(() => import("@/pages/patient/HealthRecords"));
const VisitResults = lazy(() => import("@/pages/patient/VisitResults"));
const MyComplaints = lazy(() => import("@/pages/patient/Complaints"));

const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/doctors" element={<Doctor />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/team" element={<Team />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/test" element={<Test />} />
          <Route element={<RouteProtected />}>
            <Route path="/doctors/:id" element={<DoctorDetail />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/chatbot" element={<Chatbot />} />
            <Route path="/patient" element={<PatientLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="appointments" element={<Appointments />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="relatives" element={<Relatives />} />
              <Route path="settings" element={<Settings />} />
              <Route path="messages" element={<Messages />} />
              <Route path="health-records" element={<HealthRecords />} />
              <Route path="visit-results" element={<VisitResults />} />
              <Route path="complaints" element={<MyComplaints />} />
            </Route>
          </Route>
        </Route>
        <Route path="/news" element={<News />} />
        <Route path="/news/:id" element={<NewsDetail />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/403" element={<Forbidden />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
