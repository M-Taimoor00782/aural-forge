"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SCROLL_STORY } from "@/config/scrollStory";

gsap.registerPlugin(ScrollTrigger);

export default function ScrollStoryController({
  onStoryStateChange,
}) {
  useEffect(() => {
    const triggers = SCROLL_STORY.map((storyState) => {
      const section = document.getElementById(
        storyState.sectionId
      );

      if (!section) {
        return null;
      }

      return ScrollTrigger.create({
        trigger: section,
        start: "top center",
        end: "bottom center",
        onEnter: () => {
          onStoryStateChange(storyState);
        },
        onEnterBack: () => {
          onStoryStateChange(storyState);
        },
      });
    }).filter(Boolean);

    return () => {
      triggers.forEach((trigger) => {
        trigger.kill();
      });
    };
  }, [onStoryStateChange]);

  return null;
}
