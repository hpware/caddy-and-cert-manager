"use client";
import { useEffect, useState } from "react";

export function OnBoarding() {
  const [step, setStep] = useState<number>(1);
  useEffect(() => {
    const currentOnBoarding = localStorage.getItem("onboarding_step");
    if (currentOnBoarding) {
      setStep(parseInt(currentOnBoarding));
    }
  }, []);
  // 儲存 Onboarding step
  useEffect(() => {
    localStorage.setItem("onboarding_step", step.toString());
  }, [step]);
  return <div></div>;
}
