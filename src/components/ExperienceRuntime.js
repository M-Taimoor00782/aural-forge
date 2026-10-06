"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { resolveProductState } from "@/config/productStates";

const ExperienceCanvas = dynamic(() => import("./ExperienceCanvas"), {
  ssr: false,
  loading: () => null,
});

export default function ExperienceRuntime() {
  const [activeProductState, setActiveProductState] = useState("neutral");

  const selectProductState = useCallback((stateName) => {
    resolveProductState(stateName);
    setActiveProductState(stateName);
  }, []);

  return (
    <ExperienceCanvas
      activeProductState={activeProductState}
    />
  );
}