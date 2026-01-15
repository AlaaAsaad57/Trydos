import { getTwoLetters } from "../chatsFunctions";
import profile from "public/images/profileNo.png";
import { GetImageUrl } from "utils/tinyUtils";

function ChatPhoto({
  user,
  className,
  width = 30,
  height = 30,
  fontSize = 18,
}: {
  user: any;
  className?: string;
  width?: number;
  height?: number;
  fontSize?: number;
}) {
  if (user?.photo_path)
    return (
      <img
        src={GetImageUrl(user.photo_path)}
        alt="Iamge"
        width={width}
        height={height}
        style={{
          width: `${width}px`,
          height: `${height}px`,
        }}
        className={className + " rounded-[10px] object-cover object-center"}
      />
    );
  if (user?.name?.length > 1)
    return (
      <div
        className={`text-avatar w-[${width}px] h-[${height}px]`}
        style={{
          fontSize: `${fontSize}px`,
        }}
      >
        {getTwoLetters(user.name)}
      </div>
    );
  else
    return (
      <img
        src={profile.src}
        alt="user-photo"
        width={width}
        height={height}
        className="rounded-[10px]"
      />
    );
}

export default ChatPhoto;
