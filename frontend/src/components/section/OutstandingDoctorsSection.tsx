import { useOutstandingDoctors } from "@/hooks/useOutstandingDoctors";
import DoctorCard from "../card/DoctorCard";
import Title from "../title/Title";
import { ArrowRight } from "lucide-react";
import FadeInView from "../view/FadeInView";
import DoctorCardSkeleton from "../skeleton/DoctorCardSkeleton";

const OutstandingDoctorsSection = () => {
  const { data, isLoading, isError } = useOutstandingDoctors();
  return (
    <FadeInView amount={0}>
      <section className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center gap-5">
          <div className="text-center mb-6">
            <Title text="Danh sách bác sĩ nổi bật"></Title>
            <p className="text-gray-500 text-sm md:text-base max-w-2xl mx-auto">
              Đội ngũ bác sĩ hàng đầu, giàu kinh nghiệm và tận tâm. Được
              LifeHealth chọn lọc kỹ lưỡng, sẵn sàng đồng hành cùng bạn trong
              hành trình chăm sóc sức khỏe.
            </p>
          </div>
          <div className="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-5">
            {(isLoading || isError) &&
              Array.from({ length: 4 }).map((_, i) => (
                <DoctorCardSkeleton key={i} />
              ))}

            {data?.data.map((item) => (
              <DoctorCard key={item.id} item={item} />
            ))}
          </div>
          {data?.data && (
            <div className="flex items-center gap-1 justify-end text-primary underline cursor-pointer hover:opacity-80">
              <span>Xem thêm</span>
              <ArrowRight size={16} />
            </div>
          )}
        </div>
      </section>
    </FadeInView>
  );
};

export default OutstandingDoctorsSection;
