import { Skeleton } from "components/Server/Skeleton";

/** The compare page: the title, the two search fields and the table. */
const CompareSkeleton = () => {
  return (
    <div
      className="relative w-full mx-auto overflow-hidden bg-white"
      style={{ maxWidth: 500, minHeight: "100dvh" }}
    >
      <div
        className="flex items-center"
        style={{ gap: 12, padding: "19px 16px 0" }}
      >
        <Skeleton width={25} height={25} borderRadius={6} />
        <Skeleton width={260} height={30} borderRadius={8} />
      </div>
      <div
        className="flex justify-end"
        style={{ gap: 24, margin: "56px 40px 0" }}
      >
        {[0, 1].map((i) => (
          <Skeleton key={i} width={111} height={42} borderRadius={8} />
        ))}
      </div>
      <div
        className="overflow-hidden"
        style={{
          margin: "32px 40px 0",
          borderRadius: 12,
          border: "1px solid #f1f1f1",
        }}
      >
        {Array.from({ length: 7 }, (_, i) => (
          <div
            key={i}
            className="flex items-center"
            style={{ height: 57, borderBottom: "1px solid #f4f4f4" }}
          >
            <div
              className="flex items-center h-full"
              style={{ width: 112, paddingInline: 16, background: "#f8f8f8" }}
            >
              <Skeleton width={60} height={14} borderRadius={7} />
            </div>
            <div className="flex-1" style={{ paddingInline: 16 }}>
              <Skeleton width={70} height={14} borderRadius={7} />
            </div>
            <div className="flex-1" style={{ paddingInline: 16 }}>
              <Skeleton width={70} height={14} borderRadius={7} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompareSkeleton;
