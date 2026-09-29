import Loader from "@/components/ui/Loader";

export default function Loading() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "#0B3D91",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
      }}
    >
      <Loader text="AHMAD" />
    </div>
  );
}
