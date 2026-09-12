import { useTranslation } from "react-i18next";
import Title from "../title/Title";
import FadeInView from "../view/FadeInView";

export function InspireAndShareLoveSection() {
  const { t } = useTranslation();

  const items = [
    {
      id: 1,
      title: t("home.inspireItem1"),
      img: "https://cdn2.tuoitre.vn/thumb_w/480/471584752817336320/2025/3/18/z6418683384040db976b2cb72a71af320d558624de0c30-17422890207921051446248.jpg",
      place: "Cao Bằng",
      date: "08/2025",
    },
    {
      id: 2,
      title: t("home.inspireItem2"),
      img: "https://bcp.cdnchinhphu.vn/334894974524682240/2023/7/2/3m7a3483-16882679287981305969203.jpg",
      place: "Gia Lai",
      date: "06/2025",
    },
    {
      id: 3,
      title: t("home.inspireItem3"),
      img: "https://icdn.dantri.com.vn/thumb_w/960/bec8d07d8d/2018/10/10/img20181010104721522-436ac.jpg",
      place: "Cần Thơ",
      date: "05/2025",
    },
    {
      id: 4,
      title: t("home.inspireItem4"),
      img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMGi9yhThJlwPFHEqZP96watNkO61vHM14uA&s",
      place: "Nghệ An",
      date: "04/2025",
    },
  ];

  return (
    <FadeInView>
      <section className="container mx-auto px-4 py-12">
        <div className="text-center">
          <Title text={t("home.inspireTitle")}></Title>
          <p className="mt-3 text-base md:text-lg text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">
            {t("home.inspireSubtitle")}
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
