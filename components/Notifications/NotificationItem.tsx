import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { NotificationItem as NotificationItemType } from "../../types/notifications";

interface NotificationItemProps {
  notification: NotificationItemType;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
}) => {
  const { lang } = useParams();
  const parsedDescription = React.useMemo(() => {
    try {
      return JSON.parse(notification.description);
    } catch (e) {
      return { type: "unknown", description: notification.description };
    }
  }, [notification.description]);

  const NotificationIcon = () => (
    <div className="w-10 h-10 rounded-full mr-3 bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    </div>
  );

  const renderNotificationContent = () => {
    const content = (
      <div className="flex items-start p-4 hover:bg-gray-50 transition-colors">
        {parsedDescription.boutique_icon?.file_path ||
        parsedDescription.image?.file_path ||
        parsedDescription.boutique_icon ||
        parsedDescription.image ? (
          <img
            src={
              parsedDescription.boutique_icon?.file_path ||
              parsedDescription.image?.file_path ||
              parsedDescription.boutique_icon ||
              parsedDescription.image
            }
            alt={notification.title}
            className="w-10 h-10 rounded-full mr-3 object-cover"
          />
        ) : (
          <NotificationIcon />
        )}
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{notification.title}</h4>
          <p className="text-sm text-gray-600">
            {parsedDescription.description}
          </p>
          {parsedDescription.boutique_description && (
            <div
              className="mt-1 text-sm text-gray-500"
              dangerouslySetInnerHTML={{
                __html: parsedDescription.boutique_description,
              }}
            />
          )}
        </div>
      </div>
    );

    switch (parsedDescription.type) {
      case "boutique created":
        return (
          <Link href={`/${lang}/boutiques/${parsedDescription.boutique_slug}`}>
            {content}
          </Link>
        );
      default:
        if (parsedDescription.type?.startsWith("product")) {
          return (
            <Link
              href={`/${lang}/products/${
                parsedDescription.product_slug || parsedDescription.slug
              }`}
            >
              {content}
            </Link>
          );
        }
        if (parsedDescription.type === "category created") {
          return (
            <Link
              href={`/${lang}/categories/${
                parsedDescription.category_slug || parsedDescription.slug
              }`}
            >
              {content}
            </Link>
          );
        }
        return content;
    }
  };

  return renderNotificationContent();
};

export default NotificationItem;
