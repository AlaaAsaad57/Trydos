import Link from "next/link";
import { headers } from "next/headers";

export default async function NotFound() {
  return (
    <div className="w-full items-center flex-col justify-center h-[50vh] ">
      <h2 className="text-[#5d5d5d] text-[18px] light">Not Found</h2>
      <p className="mt-[30px] text-[#5d5d5d] text-[18px] light ">
        Could not find requested resource
      </p>
      <Link
        href="/"
        className="mt-[30px] text-[#FEFEFE] text-[18px] medium cursor-pointer  flex-col w-full  rounded-[20px] text-center justify-center items-center bg-[#3C3C3C] h-[70px]"
      >
        Back To Home
      </Link>
    </div>
  );
}
