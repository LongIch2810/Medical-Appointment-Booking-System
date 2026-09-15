import { login } from "@/api/authApi";
import { fetchUserInfo } from "@/api/userApi";
import { useUserStore } from "@/store/useUserStore";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export function useLogin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setUserInfo = useUserStore((s) => s.setUserInfo);

  return useMutation({
    mutationFn: login,
    onSuccess: async () => {
      toast.success("Đăng nhập thành công!");
      // Điều hướng ngay — Home không cần userInfo để render. Trước đây
      // navigate() đợi xong fetchQuery(profile) mới chạy, khiến người dùng
      // thấy toast thành công xong phải chờ thêm 1 round-trip mạng mới
      // được chuyển trang, tạo cảm giác app bị khựng lại sau khi báo thành
      // công. Profile giờ được nạp nền, Header tự cập nhật khi có dữ liệu.
      navigate("/");
      // Bỏ cache "profile" cũ trước khi fetch — nếu vừa đăng nhập bằng tài
      // khoản khác mà không qua logout (cache trước đó vẫn còn "fresh" theo
      // staleTime), fetchQuery sẽ trả thẳng dữ liệu cũ thay vì gọi lại API,
      // khiến Header hiển thị nhầm người dùng trước đó.
      queryClient.removeQueries({ queryKey: ["profile"] });
      const query = await queryClient.fetchQuery({
        queryKey: ["profile"],
        queryFn: fetchUserInfo,
      });
      setUserInfo(query.data);
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          "Tên đăng nhập/email hoặc mật khẩu không đúng.",
        ),
      );
    },
  });
}
