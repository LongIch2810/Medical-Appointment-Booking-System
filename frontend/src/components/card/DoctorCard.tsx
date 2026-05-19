import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  Eye,
  Flame,
  Map,
  Medal,
  MessageCircle,
  Phone,
  Star,
  Stethoscope,
} from "lucide-react";
import type { DoctorCardProps } from "@/types/global";
import { Badge } from "../ui/badge";
import { useNavigate } from "react-router-dom";
import { useShow } from "@/hooks/useShow";
import DialogDisplaySchedules from "../dialog/DialogDisplaySchedules";
import { useUserStore } from "@/store/useUserStore";

export default function DoctorCard(doctorCardProps: DoctorCardProps) {
  const {
    id,
    user_id,
    picture,
    fullname,
    doctor_level,
    avg_rating,
    experience,
    specialty,
    workplace,
    address,
    phone,
    appointments_completed,
    isOutstanding,
  } = doctorCardProps.item;
  const navigate = useNavigate();
  const { isShow, setIsShow } = useShow();
  const { userInfo } = useUserStore();
  const handleOnlineAdvising = (user_id: number) => {
    if (!userInfo) {
      navigate("/sign-in");
      return;
    }

    if (!user_id) {
      return;
    }

    navigate(`/patient/messages?doctorUserId=${user_id}`);
  };

  return (
    <>
      <Card className="w-full max-w-sm rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-shadow">
        <CardHeader className="flex items-center gap-4">
          <img
            src={
              picture ||
              "https://cdn-icons-png.flaticon.com/512/2922/2922510.png"
            }
            alt={fullname}
            className="w-16 h-16 rounded-full object-cover ring-1 ring-gray-200"
            loading="lazy"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base md:text-lg line-clamp-1">
                BS.{fullname}
              </CardTitle>
              {isOutstanding && (
                <Badge
                  className="flex items-center gap-1 px-3 py-1 text-xs font-semibold 
             bg-gradient-to-r from-red-500 via-pink-500 to-orange-500
             text-white rounded-full shadow-md animate-bounce"
                >
                  <Flame size={16} className="animate-pulse" />
                  Nổi bật
                </Badge>
              )}
            </div>
            <CardDescription className="mt-1">
              <div className="flex items-center gap-1 text-xs md:text-sm">
                <Building2 size={16} />
                <span className="line-clamp-1">{workplace || "—"}</span>
              </div>
              <div className="flex items-center gap-1 text-xs md:text-sm">
                <Stethoscope size={16} />
                <span className="line-clamp-1">{specialty || "—"}</span>
              </div>
              <div className="flex items-center gap-1 text-xs md:text-sm">
                <Award size={16} />
                <span className="line-clamp-1">{doctor_level || "—"}</span>
              </div>
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs md:text-sm text-muted-foreground">
              <Star size={16} />
              <span>{avg_rating}/5 điểm đánh giá</span>
            </div>
            <div className="flex items-center gap-1 text-xs md:text-sm text-muted-foreground">
              <CheckCircle2 size={16} />
              <span>{appointments_completed} ca hoàn tất</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs md:text-sm text-muted-foreground">
            <Medal size={16} />
            <span>Kinh nghiệm: {experience} năm</span>
          </div>

          <div className="flex gap-1 text-xs md:text-sm text-muted-foreground">
            <Map size={16} />
            <span>{address}</span>
          </div>
          <div className="flex items-center gap-1 text-xs md:text-sm text-muted-foreground">
            <Phone size={16} />
            <span>Số điện thoại: {phone}</span>
          </div>
        </CardContent>

        <CardFooter className="pt-0 flex flex-col gap-3">
          <Button
            onClick={() => handleOnlineAdvising(user_id)}
            variant={"sky"}
            className="w-full flex items-center gap-2"
          >
            <MessageCircle size={16} />
            Tư vấn online
          </Button>
          <Button
            onClick={() => navigate(`/doctors/${id}`)}
            variant={"details"}
            className="w-full flex items-center gap-2"
          >
            <Eye size={16} />
            Xem chi tiết
          </Button>
          <Button
            onClick={() => setIsShow(true)}
            className="w-full flex items-center gap-2"
          >
            <Calendar size={16} />
            Đặt lịch khám
          </Button>
        </CardFooter>
      </Card>
      {isShow && (
        <DialogDisplaySchedules
          doctorId={id}
          doctorName={fullname}
          open={isShow}
          setOpen={setIsShow}
          specialtyName={specialty}
        />
      )}
    </>
  );
}
