import React from "react";
import { useParams } from "next/navigation";
import NextLink from "components/global/NextLink";
import { getConfiguredImage, translateFunction } from "utils/functions";
import { formatTime, GetImageUrl } from "utils/tinyUtils";
import { useAppStore } from "store";

const NotificationItem = ({ notification, onClose, closeWindow }) => {
  const { lang } = useParams();
  const { enableCart, disableAddToCartOption } = useAppStore();

  const parsedDescription = React.useMemo(() => {
    try {
      return JSON.parse(notification.description);
    } catch {
      return { type: "unknown", description: notification.description };
    }
  }, [notification.description]);

  const renderContent = () => {
    const src =
      (parsedDescription.boutique_icon?.file_path &&
        GetImageUrl(parsedDescription.boutique_icon.file_path)) ||
      (parsedDescription.image?.file_path &&
        GetImageUrl(parsedDescription.image.file_path)) ||
      (parsedDescription.image && GetImageUrl(parsedDescription.image)) ||
      (parsedDescription.boutique_icon &&
        GetImageUrl(parsedDescription.boutique_icon)) ||
      (parsedDescription.image_svg && GetImageUrl(parsedDescription.image_svg));

    return (
      <div className="flex items-start p-4 hover:bg-gray-50 transition-colors relative">
        {src ? (
          <img
            src={getConfiguredImage({
              src: src,
              width: 50,
              height: 50,
            })}
            alt={notification.title || "Image"}
            className="w-10 h-10 rounded-full mr-3 object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full mr-3 bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
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
          <div className="absolute bottom-2 right-2 text-[10px] text-[#5d5d5d]">
            {formatTime(notification.updated_at)}
          </div>
        </div>
      </div>
    );
  };

  const getWrapper = (content) => {
    const baseOnClick = () => {
      closeWindow();
      onClose();
    };

    switch (parsedDescription.type) {
      case "boutique created": {
        const href = `/${lang}/filters/boutiques/${parsedDescription.boutique_slug}`;
        return (
          <div className="felx" onClick={baseOnClick}>
            <NextLink
              href={href}
              ariaLabel={`notification Boutique ${parsedDescription.boutique_slug} ${lang}`}
              data={{ is_boutique: true, ...parsedDescription, href }}
            >
              {content}
            </NextLink>
          </div>
        );
      }

      case parsedDescription.type?.startsWith("product hurry up") &&
        parsedDescription.type: {
        return (
          <div
            onClick={() => {
              enableCart(true);
              disableAddToCartOption();
              baseOnClick();
            }}
          >
            {content}
          </div>
        );
      }

      case parsedDescription?.type?.startsWith("product") &&
        parsedDescription.type: {
        const slug = parsedDescription.product_slug || parsedDescription.slug;
        const href = `/${lang}/products/${slug}`;
        return (
          <div className="felx" onClick={baseOnClick}>
            <NextLink
              href={href}
              ariaLabel={`notification Product ${slug} ${lang}`}
              data={{ is_product: true, ...parsedDescription, href }}
            >
              {content}
            </NextLink>
          </div>
        );
      }

      case "category created": {
        const slug = parsedDescription.category_slug || parsedDescription.slug;
        const href = `/${lang}?mainCategory=${slug}`;
        return (
          <div className="felx" onClick={baseOnClick}>
            <NextLink
              href={href}
              ariaLabel={`notification Category ${slug} ${lang}`}
              data={{ is_category: true, ...parsedDescription, href }}
            >
              {content}
            </NextLink>
          </div>
        );
      }

      case parsedDescription.type.startsWith("order") &&
        parsedDescription.type: {
        const href = `/${lang}/setting?tab=Orders${
          parsedDescription.order_group_id
            ? `&id=${parsedDescription.order_group_id}`
            : ""
        }`;
        return (
          <div className="felx" onClick={baseOnClick}>
            <NextLink
              href={href}
              ariaLabel="notification Order"
              data={{ is_settings: true, ...parsedDescription, href }}
            >
              {content}
            </NextLink>
          </div>
        );
      }

      default:
        return content;
    }
  };

  return getWrapper(renderContent());
};

export default NotificationItem;
