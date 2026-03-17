export type OnboardingData = {
  // Step 1
  website: string;
  companyName: string;
  description: string;
  industry: string;
  language: string;
  // Step 2
  country: string;
  linkedinConnectionType: "direct" | "extension" | "";
};

export const INITIAL_ONBOARDING_DATA: OnboardingData = {
  website: "",
  companyName: "",
  description: "",
  industry: "",
  language: "",
  country: "",
  linkedinConnectionType: "",
};
