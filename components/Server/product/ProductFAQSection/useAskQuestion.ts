import { useState } from "react";
import auth from "services/auth";
import { useAppStore } from "store";
import { showErrorNotification } from "store/notifications/reducer";
import { fetchData } from "utils/fetchData";
import { CREATE_COMMENT_URL } from "utils/endpointConfig";
import { LogError, translateFunction } from "utils/functions";
import { REQUESTS_DATA } from "utils/Requests";

/**
 * Sends a shopper's question to the seller. The old ask field (`AskInput`)
 * and the new product page's blue button (Stage 7c, S7c-7) both use it.
 * `send` answers true when the backend took the question.
 */
export function useAskQuestion({
  language,
  color,
  size,
  owner_id,
  owner_type,
  productId,
  onAdded,
}: {
  language: string;
  color?: string;
  size?: string;
  owner_id: unknown;
  owner_type: unknown;
  productId: string;
  onAdded?: (comment: any) => void;
}) {
  const { setShouldUpdateCommentsCount, appendFaqComment } = useAppStore();
  const [loading, setLoading] = useState(false);
  const send = async (comment: string) => {
    try {
      let userData: any = useAppStore.getState().userProfile;
      if (userData.need_auth) {
        showErrorNotification(
          translateFunction("Please Verify Your Phone Number"),
        );
        return false;
      }
      setLoading(true);
      const variant =
        [color, size]?.filter((s) => Boolean(s))?.join("-") ?? null;
      let res = await fetchData({
        url: CREATE_COMMENT_URL,
        method: "POST",
        body: JSON.stringify({
          text: comment,
          //   @ts-ignore
          product_id: String(productId),
          user_id: String(auth.UserID()),
          user_name: auth.User()?.name,
          user_avatar: auth.User().image,
          user_type: "customer",
          phone: auth?.User()?.phone,
          owner_id: String(owner_id),
          owner_type: owner_type,
          variant,
        }),
        reqTitle: REQUESTS_DATA.ADD_COMMENT_FOR_PRODUCT,
        server: "comments",
        noMessage: true,
      });
      if (!res?.success || !res?.data?.comment_id) {
        throw new Error(
          res?.message || translateFunction("Something went wrong", language),
        );
      }
      // Prepend the new question as data (no ES-indexing setTimeout, no JSX
      // action): the fields not returned by the create call are known locally.
      const newComment = {
        id: res.data.comment_id,
        customer: {
          id: auth.UserID(),
          name: auth.User()?.name,
          image: auth.User()?.image,
        },
        product_id: String(productId),
        comment,
        variant,
        ownerId: owner_id,
        ownerType: owner_type,
        created_at: new Date().toISOString(),
        has_reply: false,
        good_quality_comment: false,
        seller_reply: null,
        seller_name: null,
        reply_created_at: null,
        total_likes: 0,
        is_liked: false,
        reply_total_likes: 0,
        reply_is_liked: false,
        isOwner: true,
      };
      // Local prepend for this widget + shared store so the new question also
      // shows in every other mounted FAQ widget (modal, extended area).
      onAdded?.(newComment);
      appendFaqComment(productId, newComment);
      setShouldUpdateCommentsCount(true);
      setLoading(false);
      return true;
    } catch (error) {
      LogError({
        error: error,
        scenario: "Error In addComment in FaqAskInput",
      });
      // The text stays in the box so the shopper can try again.
      showErrorNotification(
        error?.message || translateFunction("Something went wrong", language),
      );
      setLoading(false);
      return false;
    }
  };

  return { send, loading };
}
