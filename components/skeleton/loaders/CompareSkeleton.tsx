import Skeleton from "react-loading-skeleton";

const CompareSkeleton = () => {
  return (
    <div
      style={{
        zIndex: "99999999999999",
        top: "100px",
      }}
      className="fixed bg-[#fafafa] h-screen max-w-[1365px] mx-auto flex justify-center p-5  w-screen overflow-hidden top-[100px]"
    >
      <div className="container mx-auto p-4 max-w-7xl pb-[200px]">
        <div className="flex items-center gap-3 mb-8">
          <Skeleton width={25} height={25} />
          <Skeleton width={200} height={32} />
        </div>

        <div className="bg-white rounded-lg shadow-xs p-6">
          <div className="flex gap-6 mb-8">
            <div className="flex-1">
              <Skeleton height={48} className="rounded-lg" />
            </div>
            <div className="flex-1">
              <Skeleton height={48} className="rounded-lg" />
            </div>
          </div>

          <div className="mt-8 overflow-x-auto rounded-xl border border-gray-200 bg-gray-50 shadow-md">
            <div className="min-w-full">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <tbody>
                    {Array.from({ length: 7 }).map((_, index) => (
                      <tr key={index} className="border-b last:border-b-0">
                        <th className="p-4 text-left bg-blue-100 w-1/4 border-r border-gray-200">
                          <Skeleton height={20} />
                        </th>
                        <td className="p-4 w-[37.5%] bg-white border-r border-gray-100">
                          <Skeleton height={20} />
                        </td>
                        <td className="p-4 w-[37.5%] bg-white">
                          <Skeleton height={20} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompareSkeleton;
