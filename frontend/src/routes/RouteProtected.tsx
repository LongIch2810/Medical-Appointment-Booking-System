import { useUserStore } from "@/store/useUserStore";
import { ROLE_NAME } from "@/utils/constants";
import { useProfile } from "@/hooks/useProfile";
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

const RouteProtected = () => {
  const { userInfo, setUserInfo } = useUserStore();
  const [hasHydrated, setHasHydrated] = useState(
    useUserStore.persist.hasHydrated(),
  );
  const { data, isLoading, isFetching } = useProfile(hasHydrated);

  useEffect(() => {
    const unsubscribe = useUserStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (data?.data) {
      setUserInfo(data.data);
    }
  }, [data?.data, setUserInfo]);

  const currentUser = data?.data ?? userInfo;

  if (!hasHydrated || isLoading || (isFetching && !currentUser)) {
    return null;
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
