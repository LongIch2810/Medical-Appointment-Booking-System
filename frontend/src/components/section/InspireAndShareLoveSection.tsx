import Title from "../title/Title";
import FadeInView from "../view/FadeInView";

type Item = {
  id: number;
  title: string;
  img: string;
  place: string;
  date: string;
};

const items: Item[] = [
  {
    id: 1,
    title: "Khám miễn phí vùng cao",
    img: "https://cdn2.tuoitre.vn/thumb_w/480/471584752817336320/2025/3/18/z6418683384040db976b2cb72a71af320d558624de0c30-17422890207921051446248.jpg",
    place: "Cao Bằng",
    date: "08/2025",
  },
  {
    id: 2,
    title: "Tư vấn dinh dưỡng",
    img: "https://bcp.cdnchinhphu.vn/334894974524682240/2023/7/2/3m7a3483-16882679287981305969203.jpg",
    place: "Gia Lai",
    date: "06/2025",
  },
  {
    id: 3,
    title: "Khám mắt cộng đồng",
    img: "https://icdn.dantri.com.vn/thumb_w/960/bec8d07d8d/2018/10/10/img20181010104721522-436ac.jpg",
    place: "Cần Thơ",
    date: "05/2025",
  },
  {
    id: 4,
    title: "Cấp thuốc miễn phí",
    img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMGi9yhThJlwPFHEqZP96watNkO61vHM14uA&s",
    place: "Nghệ An",
    date: "04/2025",
  },
];

export function InspireAndShareLoveSection() {
  return (
    <FadeInView>
      <section className="container mx-auto px-4 py-12">
        <div className="text-center">
          <Title text="Truyền cảm hứng & Lan tỏa yêu thương"></Title>
          <p className="mt-3 text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
            Hơn 10.000 lượt khám miễn phí và các hoạt động thiện nguyện, cùng
            chung tay vì sức khỏe cộng đồng.
          </p>
        </div>

        {/* Gallery */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((it) => (
            <div
              key={it.id}
              className="relative overflow-hidden rounded-2xl shadow-lg group cursor-pointer"
            >
              {/* Ảnh */}
              <img
                src={it.img}
                alt={it.title}
                width={400}
                height={224}
                loading="lazy"
                decoding="async"
                className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />

              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-70 group-hover:opacity-80 transition-opacity"></div>

              {/* Thông tin */}
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <h4 className="text-lg font-semibold line-clamp-1">
                  {it.title}
                </h4>
                <p className="text-xs opacity-90">
                  {it.place} • {it.date}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </FadeInView>
  );
}

export default InspireAndShareLoveSection;
