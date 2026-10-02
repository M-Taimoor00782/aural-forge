import HeadphoneModel from "./HeadphoneModel";

export default function ProductStage() {
  return (
    <group
      position={[0, -1.5, 0]}
      rotation={[0, 0, 0]}
      scale={1.6}
    >
      <HeadphoneModel />
    </group>
  );
}
