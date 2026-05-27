import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { AppRoutes } from "@/routes/AppRoutes";

export default function App() {
  return (
    <>
      <AppRoutes />
      <ToastContainer
        position="top-right"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}
