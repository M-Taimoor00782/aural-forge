"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { resolveProductState } from "@/config/productStates";
import ScrollStoryController from "./ScrollStoryController";

const ExperienceCanvas = dynamic(() => import("./ExperienceCanvas"), {
  ssr: false,
  loading: () => null,
});

export default function ExperienceRuntime() {
  const [activeProductState, setActiveProductState] = useState("neutral");
  const [acousticRevealActive, setAcousticRevealActive] = useState(false);
  const [choreographyActive, setChoreographyActive] = useState(false);

  const selectProductState = useCallback((stateName) => {
    resolveProductState(stateName);
    setActiveProductState(stateName);
  }, []);

  const handleStoryStateChange = useCallback(
    (storyState) => {
      selectProductState(storyState.productState);
      setAcousticRevealActive(storyState.acousticRevealActive);
    },
    [selectProductState],
  );

  return (
    <>
      <ScrollStoryController onStoryStateChange={handleStoryStateChange} />

      <ExperienceCanvas
        activeProductState={activeProductState}
        acousticRevealActive={acousticRevealActive}
        choreographyActive={choreographyActive}
        onChoreographyActiveChange={setChoreographyActive}
      />
    </>
  );
}
