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
  Building2,
  Calendar,
  CheckCircle2,
  Eye,
  Flame,
  MapPin,
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
      <Card className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-0 shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
        <div>
          {/* Header */}
          <CardHeader className="flex flex-row items-start gap-3.5 border-b border-slate-100/80 dark:border-slate-800 bg-gradient-to-br from-slate-50/70 via-white to-primary/5 dark:from-slate-900 dark:via-slate-900 dark:to-primary/10 p-4.5">
            <div className="relative shrink-0">
              <img
                src={
                  picture ||
                  "https://cdn-icons-png.flaticon.com/512/2922/2922510.png"
                }
                alt={fullname}
                width={60}
                height={60}
                loading="lazy"
                decoding="async"
                className="h-15 w-15 rounded-2xl object-cover ring-2 ring-primary/20 shadow-2xs transition-transform group-hover:scale-105"
              />
              <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white dark:border-slate-900 bg-emerald-500" />
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between gap-1.5">
                <CardTitle className="truncate text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">
                  BS. {fullname}
                </CardTitle>
                {isOutstanding && (
                  <Badge
                    className="flex shrink-0 items-center gap-1 rounded-full bg-linear-to-r from-rose-500 via-pink-500 to-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs border-none"
                  >
                    <Flame size={12} className="animate-pulse" />
                    Nổi bật
                  </Badge>
                )}
              </div>

              <CardDescription className="space-y-0.5 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5 font-medium text-primary truncate">
                  <Stethoscope size={13} className="shrink-0" />
                  <span className="truncate">{specialty || "Bác sĩ chuyên khoa"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 truncate">
                  <Building2 size={13} className="shrink-0" />
                  <span className="truncate">{workplace || "Bệnh viện đa khoa"}</span>
                </div>
                {doctor_level && (
                  <div className="inline-block rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                    {doctor_level}
                  </div>
                )}
              </CardDescription>
            </div>
          </CardHeader>

          {/* Content */}
          <CardContent className="space-y-2.5 p-4.5 text-xs">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 p-2.5 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
                <Star size={14} className="fill-amber-400 text-amber-400" />
                <span>{avg_rating.toFixed(1)} / 5</span>
              </div>
              <div className="flex items-center justify-end gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span>{appointments_completed} ca khám</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
              <Medal size={14} className="text-primary shrink-0" />
              <span>Kinh nghiệm: <strong className="text-slate-800 dark:text-slate-200">{experience} năm</strong></span>
            </div>

            {address && (
              <div className="flex items-start gap-1.5 text-slate-500 dark:text-slate-400">
                <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                <span className="line-clamp-1">{address}</span>
              </div>
            )}

            {phone && (
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <Phone size={14} className="text-slate-400 shrink-0" />
                <span>{phone}</span>
              </div>
            )}
          </CardContent>
        </div>

        {/* Footer Actions */}
        <CardFooter className="flex flex-col gap-2 p-4.5 pt-0">
          <Button
            onClick={() => setIsShow(true)}
            className="w-full gap-2 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-xs sm:text-sm shadow-xs cursor-pointer h-10"
          >
            <Calendar size={15} />
            <span>Đặt lịch khám ngay</span>
          </Button>

          <div className="grid grid-cols-2 gap-2 w-full">
            <Button
              onClick={() => handleOnlineAdvising(user_id)}
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-xl border-sky-200 dark:border-sky-800/60 bg-sky-50/50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-xs font-semibold h-8.5 cursor-pointer"
            >
              <MessageCircle size={13} />
              Tư vấn
            </Button>
            <Button
              onClick={() => navigate(`/doctors/${id}`)}
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold h-8.5 cursor-pointer"
            >
              <Eye size={13} />
              Chi tiết
            </Button>
          </div>
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

