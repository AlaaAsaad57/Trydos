import UserIcon from "public/svg/userIcon.svg";
import Image from "next/image";
import { useAppStore } from "store";

interface UserAvatarProps {
  avatar: string | any;
  onClick?: () => void;
}
function UserAvatar({ avatar, onClick }: UserAvatarProps) {
  const { userProfile } = useAppStore();
  return (
    <>
      {avatar || userProfile?.image ? (
        <>
          <div
            onClick={onClick}
            className="nav-question-item nav-img-item w-[30px] h-[30px] "
            data-cy="avatar-options"
            style={{
              marginLeft: "0px",
              position: "relative",
              padding: "0px",

              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div className="inset-shadow w-[30px] h-[30px] top-0 left-0"></div>
            <Image
              alt="user-img"
              width={30}
              height={30}
              src={avatar || userProfile?.image}
              quality={100}
              priority={true}
              fetchPriority="auto"
              className="avatar-user-image object-cover object-center"
            />
          </div>
        </>
      ) : (
        <div
          onClick={onClick}
          className="nav-question-item"
          data-cy="avatar-options"
          style={{ marginLeft: "0px" }}
        >
          <UserIcon style={{ transform: "scale(1)" }} />
        </div>
      )}
    </>
  );
}

export default UserAvatar;
