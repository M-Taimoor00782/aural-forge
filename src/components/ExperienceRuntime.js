"use client";

import dynamic from "next/dynamic";

const ExperienceCanvas = dynamic(() => import("./ExperienceCanvas"), {
  ssr: false,
  loading: () => null,
});

export default function ExperienceRuntime() {
  return <ExperienceCanvas />;
}
