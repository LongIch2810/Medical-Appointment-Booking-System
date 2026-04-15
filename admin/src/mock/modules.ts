import { adminModuleConfigs } from "@/mock/modules-admin";
import { contentModuleConfigs } from "@/mock/modules-content";
import { doctorModuleConfigs } from "@/mock/modules-doctor";

export const moduleConfigs = {
  ...doctorModuleConfigs,
  ...contentModuleConfigs,
  ...adminModuleConfigs,
};
