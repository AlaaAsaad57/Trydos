import React from "react";
import Link from "next/link";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { NotificationItem as NotificationItemType } from "../../types/notifications";
import { translateFunction } from "utils/functions";
import { useAppStore } from "store";
import NextLink from "components/global/NextLink";

interface NotificationItemProps {
  notification: NotificationItemType;
  onClose: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClose,
}) => {
  const { enableCart } = useAppStore();
  const { lang } = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const parsedDescription = React.useMemo(() => {
    try {
      return JSON.parse(notification.description);
    } catch (e) {
      return { type: "unknown", description: notification.description };
    }
  }, [notification.description]);

  const NotificationIcon = () => (
    <div
      className="w-10 h-10 rounded-full mr-3 bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center"
      data-cy="container-svg"
    >
      <svg
        data-cy="svg-notification"
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
        <div className="flex-1" data-cy="notification-item-body">
          <h4
            className="font-medium text-gray-900"
            data-cy="notification-item-description"
          >
            {parsedDescription.description}
          </h4>
          <p
            className="text-sm text-gray-600"
            data-cy="notification-Click-show"
          >
            {translateFunction("Click to view details")}
          </p>
          {parsedDescription.boutique_description && (
            <div
              className="mt-1 text-sm text-gray-500"
              data-cy="tester-not-know"
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
          <NextLink
            ariaLabel={`notification Boutique ${parsedDescription.boutique_slug} ${lang}`}
            href={`/${lang}/boutiques/${parsedDescription.boutique_slug}`}
          >
            {content}
          </NextLink>
        );
      default:
        if (parsedDescription.type?.startsWith("product hurry up")) {
          return (
            <div
              onClick={() => {
                window.history.pushState({ isPopup: true }, "open Cart");
                enableCart(true);
                const newParams = new URLSearchParams(searchParams);
                newParams.set("cart", "true");

                // Use router.push with pathname and updated query
                // @ts-ignore
                router.push(`${pathname}?${newParams.toString()}`, {
                  // @ts-ignore
                  shallow: true,
                });
                onClose();
              }}
            >
              {content}
            </div>
          );
        }
        if (parsedDescription.type?.startsWith("product")) {
          return (
            <NextLink
              ariaLabel={`notification Product ${
                parsedDescription.product_slug || parsedDescription.slug
              } ${lang}`}
              href={`/${lang}/products/${
                parsedDescription.product_slug || parsedDescription.slug
              }`}
            >
              {content}
            </NextLink>
          );
        }
        if (parsedDescription.type === "category created") {
          return (
            <NextLink
              ariaLabel={`notification Category ${
                parsedDescription.category_slug || parsedDescription.slug
              } ${lang}`}
              href={`/${lang}/boutiques/listing?categories=${
                parsedDescription.category_slug || parsedDescription.slug
              }`}
            >
              {content}
            </NextLink>
          );
        }

        return content;
    }
  };

  return renderNotificationContent();
};

export default NotificationItem;
