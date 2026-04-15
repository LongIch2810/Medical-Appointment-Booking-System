import Lottie from "lottie-react";
import nutritionAnimation from "../../assets/animations/Nutrition.json";
const NutritionAnimation = () => {
  return (
    <div className="flex justify-center items-center">
      <Lottie
        animationData={nutritionAnimation}
        loop={true}
        autoplay={true}
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

export default NutritionAnimation;
