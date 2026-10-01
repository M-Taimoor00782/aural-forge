import ExperienceRuntime from "@/components/ExperienceRuntime";

export default function Home() {
  return (
    <main>
      <section>
        <h1>Aural Forge</h1>
        <p>The DOM remains independent of the 3D runtime.</p>
      </section>

      <div style={{ width: "100%", height: "320px" }} aria-hidden="true">
        <ExperienceRuntime />
      </div>
    </main>
  );
}
