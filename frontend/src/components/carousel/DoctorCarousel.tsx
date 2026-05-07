// components/DoctorCarousel.tsx
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { DoctorCardData } from "@/types/global";

import DoctorCard from "../card/DoctorCard";

const doctors: DoctorCardData[] = [
  {
    id: 1,
    user_id: 1,
    fullname: "John Doe",
    picture:
      "https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.1.0",
    specialty: "Noi tong quat",
    experience: 5,
    workplace: "Benh vien Bach Mai",
    doctor_level: "BS",
    avg_rating: 5,
    appointments_completed: 0,
    address: "",
    phone: "",
    isOutstanding: true,
  },
  {
    id: 2,
    user_id: 2,
    fullname: "Jane Smith",
    picture:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=2070&auto=format&fit=crop",
    specialty: "Nhi khoa",
    experience: 5,
    workplace: "Benh vien Da khoa",
    doctor_level: "BS",
    avg_rating: 5,
    appointments_completed: 0,
    address: "",
    phone: "",
    isOutstanding: true,
  },
  {
    id: 3,
    user_id: 3,
    fullname: "Alan Turing",
    picture:
      "https://plus.unsplash.com/premium_photo-1661764878654-3d0fc2eefcca?q=80&w=1887&auto=format&fit=crop",
    specialty: "Da lieu",
    experience: 5,
    workplace: "Benh vien Viet Duc",
    doctor_level: "BS",
    avg_rating: 5,
    appointments_completed: 0,
    address: "",
    phone: "",
    isOutstanding: true,
  },
  {
    id: 4,
    user_id: 4,
    fullname: "Adam Woods",
    picture:
      "https://plus.unsplash.com/premium_photo-1681996484614-6afde0d53071?q=80&w=2070&auto=format&fit=crop",
    specialty: "Da lieu",
    experience: 5,
    workplace: "Benh vien CuBa",
    doctor_level: "BS",
    avg_rating: 5,
    appointments_completed: 0,
    address: "",
    phone: "",
    isOutstanding: true,
  },
];

export default function DoctorCarousel() {
  return (
    <div className="relative mx-auto w-full max-w-6xl">
      <div className="relative">
        <Carousel className="w-full">
          <CarouselContent>
            {doctors.map((doctor) => (
              <CarouselItem
                key={doctor.id}
                className="basis-full sm:basis-1/2 lg:basis-1/3"
              >
                <DoctorCard item={doctor} />
              </CarouselItem>
            ))}
          </CarouselContent>

          <CarouselPrevious className="absolute -left-5 top-1/2 z-20 -translate-y-1/2" />
          <CarouselNext className="absolute -right-5 top-1/2 z-20 -translate-y-1/2" />
        </Carousel>
      </div>
    </div>
  );
}
