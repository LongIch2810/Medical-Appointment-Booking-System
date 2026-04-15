import Lottie from "lottie-react";
import findADoctorAnimation from "../../assets/animations/findadoctor.json";

const FindADoctorAnimation = () => {
  return (
    <div className="flex justify-center items-center w-full">
      <Lottie
        animationData={findADoctorAnimation}
        loop
        autoplay
        className="
          w-[90%] max-w-[700px] 
          h-auto 
          sm:w-[400px] sm:h-[300px]   /* 📱 Mobile */
          md:w-[550px] md:h-[400px]   /* 💻 Tablet */
          lg:w-[700px] lg:h-[500px]   /* 🖥️ Laptop/Desktop */
        "
      />
    </div>
  );
};

export default FindADoctorAnimation;
