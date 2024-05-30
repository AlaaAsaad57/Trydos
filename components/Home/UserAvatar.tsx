import UserIcon from "public/svg/userIcon.svg";
import Image from "next/image";
interface UserAvatarProps {
  avatar: string;
  onClick: Function;
}
function UserAvatar({ avatar, onClick }: UserAvatarProps) {
  return (
    <>
      {avatar ? (
        <>
          <div
            onClick={() => onClick()}
            className="nav-question-item nav-img-item"
            style={{
              marginLeft: "0px",
              position: "relative",
              padding: "0px",
              width: "46px",
              height: "46px",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div className="inset-shadow"></div>
            <Image
              alt="user-img"
              width={30}
              height={30}
              src={avatar}
              quality={100}
              priority={true}
              fetchPriority="low"
              className="avatar-user-image"
            />
          </div>
        </>
      ) : (
        <div
          onClick={() => onClick()}
          className="nav-question-item"
          style={{ marginLeft: "0px" }}
        >
          <UserIcon style={{ transform: "scale(1)" }} />
        </div>
      )}
    </>
  );
}

export default UserAvatar;
