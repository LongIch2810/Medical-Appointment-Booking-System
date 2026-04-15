import { useUserStore } from "@/store/useUserStore";
import { ROLE_NAME } from "@/utils/constants";
import { Navigate, Outlet } from "react-router-dom";

const RouteProtected = () => {
  const { userInfo } = useUserStore();
  if (!userInfo) {
    return <Navigate to="/sign-in" replace />;
  }

  const isPatient = userInfo.roles.some(
    (role) => role.role_name === ROLE_NAME.PATIENT,
  );
  if (!isPatient) {
    return <Navigate to="/403" replace />;
  }
  return <Outlet />;
};

export default RouteProtected;
