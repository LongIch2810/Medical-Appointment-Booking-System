export const openEducationalDisclaimer = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("lifehealth:open-disclaimer"));
  }
};
