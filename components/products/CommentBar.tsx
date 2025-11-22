import React, { useState } from "react";
import CommentPost from "public/svg/CommentPost";
import auth from "services/auth";
import { translateFunction } from "utils/functions";
import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";
import { useParams } from "next/navigation";
import {
  COOKIE_NAMES,
  getCookie,
  UserData,
} from "utils/cookies/cookie-manager";
import { showErrorNotification } from "store/notifications/reducer";
import { useAppStore } from "store";
import { getFirstLetterLang } from "utils/tinyUtils";
function CommentBar() {
  const params = useParams();
  const { SelectedProduct, editInfo } = useAppStore();
  const [country, language] = (params.lang as string).split("-");
  const addCommentAction = (s) => {
    editInfo({
      fqa_questions: {
        ...SelectedProduct?.fqa_questions,
        comments: [
          { ...s, is_verfied: false },
          ...SelectedProduct?.fqa_questions?.comments,
        ],
      },
    });
    // setComments([{ ...s, is_verfied: false }, ...CommentsData]);
    setTimeout(() => {
      document.querySelector(".comments-extended").scrollTop = 0;
    }, 300);
  };

  const [val, setVal] = useState("");
  const user = auth.User();
  const addComment = async (s) => {
    let userData: any = getCookie(COOKIE_NAMES.USER_DATA);
    if (userData.need_auth) {
      showErrorNotification(
        translateFunction("Please Verify Your Phone Number")
      );
      return null;
    }
    let mid = Math.round(Math.random() * 1000);
    try {
      addCommentAction({
        comment: s,
        customer: { id: user.id, name: user.name, image: user.image },
        created_at: new Date().toISOString(),
        mid: mid,
      });
      setVal("");
      const variant =
        [SelectedProduct?.ActiveColor, SelectedProduct?.ActiveSize]
          ?.filter((s) => Boolean(s))
          ?.join("-") ?? null;
      let response = await fetchData({
        url: "/public_comment/comments/create",
        method: "POST",
        body: JSON.stringify({
          text: s,
          //   @ts-ignore
          product_id: String(SelectedProduct?.id),
          user_id: String(auth.UserID()),
          user_name: auth.User()?.name,
          user_avatar: auth.User().image,
          user_type: "customer",
          phone: auth?.User()?.phone,
          owner_id: String(SelectedProduct?.owner_id),
          owner_type: SelectedProduct?.owner_type,
          variant,
        }),
        reqTitle: REQUESTS_DATA.ADD_COMMENT_FOR_PRODUCT,
        server: "comments",
      });
      // @ts-ignore
      if (!response.success) {
        // @ts-ignore
        throw new Error(response.message);
      }
      fetch(
        `/api/editSocialProduct?pid=${SelectedProduct.id}&slug=${SelectedProduct.slug}&language=${language}&country=${country}`
      );
      if (response.data?.comment_id) {
        let newComment = {
          id: response.data.comment_id,
          customer: {
            id: response?.data.user_id,
            name: response?.data.user_name,
            image: response?.data.user_avatar,
          },
          order_details_id: response?.data?.order_details_id,
          star_rating: response?.data?.rating,
          comment: response?.data?.text,
          variant: response?.data?.variant,
          created_at: response?.data?.created_at,
          product_id: String(SelectedProduct?.id),
        };
        editInfo({
          fqa_questions: {
            ...SelectedProduct?.fqa_questions,
            comments: [
              { ...newComment, is_verfied: false, mid: mid },
              ...SelectedProduct.fqa_questions?.comments?.filter(
                (com) => com.mid !== mid
              ),
            ],
          },
        });
        // verifyComment(mid, newComment);
      } else {
        throw new Error("Error");
        // isError(mid);
      }
    } catch (e) {
      const { SelectedProduct: productData } = useAppStore.getState();
      let selected_comment = productData.fqa_questions.comments.filter(
        (m) => m.mid === mid
      )[0];
      console.log(
        SelectedProduct.fqa_questions,
        productData.fqa_questions,
        selected_comment,
        mid
      );

      editInfo({
        fqa_questions: {
          ...productData.fqa_questions,
          comments: [
            { ...selected_comment, is_verfied: false, isError: true },
            ...productData.fqa_questions.comments?.filter(
              (comment) => comment.mid !== mid
            ),
          ],
        },
      });
      // isError(mid);
    }
  };

  return (
    <div className="comment-input-holder relative">
      <textarea
        data-cy="CommentField"
        tabIndex={0}
        aria-label={translateFunction("Comment input")}
        className={`w-full resize-none outline-none p-2 rounded border border-gray-300 min-h-[40px] max-h-[120px] transition-all duration-200 ${" bg-white"}`}
        style={{
          textAlign: getFirstLetterLang(val),
        }}
        onKeyDown={(e) => {
          // @ts-ignore
          if ((e.key === "Enter" || e.keyCode === "13") && !e.shiftKey) {
            e.preventDefault();
            // @ts-ignore
            addComment(e.target.value);
            e.currentTarget.style.height = "auto";
            // Sendevent({
            //   event: GA_EVENT_NAMES.CLICK,
            //   value: GA_CLICK_EVENT_VALUES.CONFIRM_COMMENT_BUTTON,
            // });
          }
        }}
        onInput={(e) => {
          e.currentTarget.style.height = "auto";
          e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
        }}
        placeholder={translateFunction("type a comment")}
        value={val}
        onChange={(e) => {
          setVal(e.target.value);
        }}
      />
      {val?.length > 0 && (
        <span
          className={`${
            getFirstLetterLang(val) === "left"
              ? "right-[30px]"
              : "left-[30px] rotate-[180deg]"
          } absolute h-full flex items-center top-0`}
          data-cy="SubmitComment"
          onClick={() => {
            // @ts-ignore
            addComment(val);
            document.querySelector("textarea").style.height = "auto";
            // Sendevent({
            //   event: GA_EVENT_NAMES.CLICK,
            //   value: GA_CLICK_EVENT_VALUES.CONFIRM_COMMENT_BUTTON,
            // });
          }}
        >
          <CommentPost />
        </span>
      )}
    </div>
  );
}

export default CommentBar;
