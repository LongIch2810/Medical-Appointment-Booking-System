import { useUserStore } from "@/store/useUserStore";
import { ROLE_NAME } from "@/utils/constants";
import { useProfile } from "@/hooks/useProfile";
import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import RouteLoadingFallback from "@/components/common/RouteLoadingFallback";

const RouteProtected = () => {
  const { userInfo, setUserInfo } = useUserStore();
  const { data, isLoading, isFetching } = useProfile();

  useEffect(() => {
    if (data?.data) {
      setUserInfo(data.data);
    }
  }, [data?.data, setUserInfo]);

  const currentUser = data?.data ?? userInfo;

  if (isLoading || (isFetching && !currentUser)) {
    return <RouteLoadingFallback />;
  }

  if (!currentUser) {
    return <Navigate to="/sign-in" replace />;
  }

  const isPatient = currentUser.roles.some(
    (role) => role.role_name === ROLE_NAME.PATIENT,
  );
  if (!isPatient) {
    return <Navigate to="/403" replace />;
  }
  return <Outlet />;
};

export default RouteProtected;
