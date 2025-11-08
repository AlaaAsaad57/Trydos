import UserIcon from "public/svg/userIcon.svg";
import Image from "next/image";
import { GetImageUrl } from "utils/tinyUtils";
import { getConfiguredImage } from "utils/functions";

interface UserAvatarProps {
  avatar: string | any;
  onClick?: () => void;
  showIndicator: boolean;
}
function UserAvatar({ avatar, onClick, showIndicator }: UserAvatarProps) {
  return (
    <>
      {avatar ? (
        <>
          <div
            onClick={onClick}
            className="nav-question-item nav-img-item w-[30px] h-[30px] relative"
            data-cy="avatar-options"
            style={{
              marginLeft: "0px",
              position: "relative",
              padding: "0px",

              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {showIndicator && (
              <span className="absolute test w-[10px] h-[10px] bg-[#f64f64] rounded-full top-[-2px] right-[-2px] animate-pulse z-20 left-[initial]"></span>
            )}
            <div className="inset-shadow w-[30px] h-[30px] top-0 left-0"></div>
            <Image
              alt="user-img"
              width={30}
              height={30}
              src={GetImageUrl(avatar)}
              quality={100}
              className="avatar-user-image object-cover object-center"
            />
          </div>
        </>
      ) : (
        <div
          onClick={onClick}
          className="nav-question-item relative"
          data-cy="avatar-options"
          style={{ marginLeft: "0px" }}
        >
          {showIndicator && (
            <span className="absolute test w-[10px] h-[10px] left-[initial] bg-[#f64f64] rounded-full top-[-2px] right-[-2px] animate-pulse z-20"></span>
          )}
          <UserIcon style={{ transform: "scale(1)" }} />
        </div>
      )}
    </>
  );
}

export default UserAvatar;
