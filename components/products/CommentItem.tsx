import React, { useState, useRef, useEffect } from "react";
import "styles/comment.css";
import Loading from "public/svg/loading.svg";
import { CommentItemPropsType } from "models/componentType/CommentItemPropsType";
import { getCookie, COOKIE_NAMES } from "utils/cookies/cookie-manager";
import { ConfirmModal } from "components/global/ConfirmModal";
import ThreePointsIcon from "public/svg/threepoints.svg";
import DeleteCommentIcon from "public/svg/DeleteCommentIcon.svg";
import PenIcon from "public/svg/PenIcon.svg";
import { showErrorNotification } from "store/notifications/reducer";
import { useParams } from "node_modules/next/navigation";
import { translateFunction } from "utils/functions";
import { FaqItem } from "./FAQSection";
import { fetchData } from "utils/fetchData";
import { useAppStore } from "store";
import { convertTextToXFormat, formatTime, GetImageUrl } from "utils/tinyUtils";
import Image from "node_modules/next/image";
import profilePng from "public/images/profileNo.png";
import auth from "services/auth";
import { REQUESTS_DATA } from "utils/Requests";

function CommentItem({
  custmerId,
  name,
  photo,
  date,
  text,
  isPending,
  isError,
  comment,
  isFull = false,
}: CommentItemPropsType) {
  const { lang }: { lang: string } = useParams();
  let languageVariable = lang.split("-")[1];
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [showUpdateElement, setShowUpdate] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const { editInfo, SelectedProduct } = useAppStore();
  const userData: any = getCookie(COOKIE_NAMES.USER_DATA);

  const isOwner = String(userData?.id) === String(custmerId);
  const isVerify = userData?.is_phone_verified !== 0;

  // Delete comment
  const handleDeleteComment = async () => {
    setDeleteLoading(true);
    try {
      const response = await fetchData({
        url: `/public_comment/comments/${comment.id}/delete`,
        reqTitle: { reqTitle: "DELETE_COMMENT", code: 1000 },
        method: "DELETE",
        server: "comments",
      });
      if (!response.success) throw new Error(response.message);

      editInfo({
        fqa_questions: {
          ...SelectedProduct,
          comments: SelectedProduct.fqa_questions.comments?.filter(
            (s) => s.id !== comment.id
          ),
          total: SelectedProduct.fqa_questions.total - 1,
        },
      });
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Error deleting comment:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  const handleMenuToggle = () => {
    if (!isVerify) {
      showErrorNotification(
        translateFunction("Please verify the number first.", languageVariable)
      );
      return;
    }
    setShowMenu(!showMenu);
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
    setShowMenu(false);
  };

  const handleUpdateClick = () => {
    setShowUpdate(true);
    setShowMenu(false);
  };
  const ErrorAccure = (mid) => {
    let { SelectedProduct: ProductData } = useAppStore.getState();
    let selected_comment = ProductData.fqa_questions.comments.filter(
      (m) => m.mid === mid
    )[0];
    editInfo({
      fqa_questions: {
        ...ProductData.fqa_questions,
        comments: [
          { ...selected_comment, is_verfied: false, isError: true },
          ,
          ...ProductData.fqa_questions.comments?.filter(
            (comment) => comment.mid !== mid
          ),
        ],
      },
    });
  };
  const increase_comments = () => {
    editInfo({
      fqa_questions: {
        ...SelectedProduct?.fqa_questions,
        total: SelectedProduct?.fqa_questions?.total + 1,
      },
    });
  };
  const resendCommentApi = async (mid, s) => {
    try {
      let { SelectedProduct, editInfo } = useAppStore.getState();
      let selected_comment = SelectedProduct.fqa_questions.comments.filter(
        (m) => m.mid === s.mid
      )[0];
      editInfo({
        fqa_questions: {
          ...SelectedProduct.fqa_questions,
          comments: [
            {
              ...selected_comment,
              is_verfied: false,
              isError: false,
            },
            ...SelectedProduct.fqa_questions.comments?.filter(
              (comment) => comment.mid !== s.mid
            ),
          ],
        },
      });
      let userData: any = getCookie(COOKIE_NAMES.USER_DATA);
      if (userData.need_auth) {
        showErrorNotification(
          translateFunction("Please Verify Your Phone Number")
        );
        return null;
      }
      let response = await fetchData({
        url: "/public_comment/comments/create",
        method: "POST",
        body: JSON.stringify({
          text: s,
          //   @ts-ignore
          product_id: String(productId),
          user_id: String(auth.UserID()),
          user_name: auth.User()?.name,
          user_avatar: auth.User().image,
          user_type: "customer",
          phone: auth?.User()?.phone,
        }),
        reqTitle: REQUESTS_DATA.ADD_COMMENT_FOR_PRODUCT,
        server: "comments",
      });

      // @ts-ignore
      if (!response.success) {
        // @ts-ignore
        throw new Error(response.message);
      }
      fetch(`/api/editSocialProduct?pid=${SelectedProduct.id}`);
      if (response.data?.comment_id) {
        // verifyCommentAction(mid);

        increase_comments();
        let { SelectedProduct, editInfo } = useAppStore.getState();
        let selected_comment = SelectedProduct.fqa_questions.comments.filter(
          (m) => m.mid === mid
        )[0];
        editInfo({
          fqa_questions: {
            ...SelectedProduct.fqa_questions,
            comments: [
              {
                ...selected_comment,
                id: response.data?.comment_id,
                customer: {
                  name: response.data?.user_name,
                  image: response?.data.user_avatar,
                  id: response?.data?.user_id,
                },
                is_verfied: false,
                isError: false,
              },
              ...SelectedProduct.fqa_questions.comments?.filter(
                (comment) => comment.mid !== mid
              ),
            ],
          },
        });
      } else {
        ErrorAccure(mid);
      }
    } catch (e) {
      ErrorAccure(mid);
    }
  };
  return (
    <>
      <div
        className={`${!isPending && !isError && "opacity-70"} relative flex  ${
          isFull ? "max-w-full w-full" : "max-w-[710px] min-w-[85vw] "
        }`}
      >
        {isError && (
          <Loading
            className="absolute z-50 right-[10px] top-[45px]"
            onClick={resendCommentApi(comment.mid, comment)}
          />
        )}
        {isOwner && !isError && isPending && (
          <div
            className="absolute top-[45px] right-[10px] z-50 w-[30px] h-[30px]"
            ref={menuRef}
          >
            {!showUpdateElement && (
              <div
                className="comment-menu-btn absolute z-50 right-[10px] top-[30px] cursor-pointer flex items-center justify-center w-[20px] h-[20px]"
                style={{
                  borderRadius: "50%",
                  transition: "background-color 0.2s ease",
                }}
                onClick={handleMenuToggle}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") handleMenuToggle();
                }}
                tabIndex={0}
                role="button"
                aria-label="Comment options menu"
              >
                <ThreePointsIcon
                  style={{
                    filter: "drop-shadow(0px 1px 2px rgba(0,0,0,0.1))",
                  }}
                />
              </div>
            )}

            {showMenu && (
              <div className="absolute z-50 right-[10px] top-[10px] bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px]">
                <button
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  onClick={handleUpdateClick}
                  disabled={updateLoading}
                >
                  <PenIcon className="w-4 h-4" />
                  {updateLoading ? "Updating..." : "Update"}
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                  onClick={handleDeleteClick}
                >
                  <DeleteCommentIcon className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}

        {showUpdateElement ? (
          <UpdateCommentElement
            loading={updateLoading}
            setLoading={setUpdateLoading}
            close={() => setShowUpdate(false)}
            has_reply={comment.has_reply}
            comment={comment}
            isFull={true}
            editInfo={editInfo}
            SelectedProduct={SelectedProduct}
            language={languageVariable}
          />
        ) : (
          <FaqItem
            isError={isError}
            isFull={true}
            comment={comment}
            language={languageVariable}
          />
        )}
      </div>

      {showDeleteModal && (
        <ConfirmModal
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteComment}
          loading={deleteLoading}
          type="Delete"
          showModal={showDeleteModal}
          confirmMessage="Are you sure you want to delete this comment?"
          confirmTilte={"Delete Comment"}
        />
      )}
    </>
  );
}

export default CommentItem;

// ---------------- UPDATE ELEMENT ----------------
const UpdateCommentElement = ({
  isFull,
  has_reply,
  comment,
  loading,
  setLoading,
  close,
  editInfo,
  SelectedProduct,
  language,
}) => {
  const [value, setValue] = useState(comment.comment || "");
  const isChanged = value.trim() !== comment.comment;

  const handleUpdate = async () => {
    if (!isChanged || !value.trim()) return;
    setLoading(true);
    try {
      const response = await fetchData({
        url: `/public_comment/comments/${comment.id}/update`,
        reqTitle: REQUESTS_DATA.UPDATE_COMMENT,
        method: "PUT",
        server: "comments",
        body: JSON.stringify({ text: value.trim() }),
      });
      if (!response.success) throw new Error(response.message);

      // Update comment locally
      editInfo({
        fqa_questions: {
          ...SelectedProduct,
          comments: SelectedProduct.fqa_questions.comments?.map((c) =>
            c.id === comment.id ? { ...c, comment: value.trim() } : c
          ),
        },
      });

      close(); // close edit mode
    } catch (err) {
      console.error("Error updating comment:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => close();

  return (
    <div className="relative flex w-full">
      <div
        className={`flex-col min-w-[85%] ${
          isFull ? "max-w-full w-full" : "max-w-[90%]"
        }`}
      >
        <div
          className={`comment-item ${
            has_reply ? "rounded-t-[15px] rounded-b-[0px]" : "rounded-[15px]"
          } flex-col justify-between max-w-full w-full min-h-[111px] py-[8px] px-[10px]`}
          style={{
            backgroundColor: "#F8F8F8",
          }}
        >
          <div className="w-full flex-col">
            <div className="flex-row items-center">
              <div className="comment-photo">
                <Image
                  src={GetImageUrl(comment?.customer?.image) ?? profilePng}
                  width={20}
                  height={20}
                  alt={convertTextToXFormat(comment?.customer?.name)}
                />
              </div>
              <div className="comment-content capitalize">
                <div className="comment-source text-[#1D1D1D] text-[9px] regular">
                  <span className="bold pr-[4px]">A</span>{" "}
                  {convertTextToXFormat(comment?.customer?.name)}
                </div>
              </div>
            </div>
            <span className="medium text-[#1d1d1d] text-[9px] mt-[5px]">
              Blue | Medium
            </span>
            <div className="comment-date text-[9px]">
              {formatTime(comment?.created_at)}
            </div>
            <textarea
              className="comment-text regular text-[#1d1d1d] text-[11px] mt-[5px] w-full resize-none rounded-[6px] border border-[#ccc] p-[4px] focus:outline-none focus:ring-1 focus:ring-gray-400"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={loading}
              onKeyDown={(e) => {
                if (
                  (e.key === "Enter" && e.ctrlKey) ||
                  (e.key === "Enter" && e.metaKey)
                ) {
                  e.preventDefault();
                  handleUpdate();
                }
              }}
            />
          </div>

          <div className="flex justify-end mt-[6px] gap-[6px]">
            <button
              onClick={handleCancel}
              disabled={loading}
              className="text-[10px] text-gray-500 px-2 py-1 border border-gray-300 rounded-[5px] hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              disabled={loading || !isChanged}
              className={`text-[10px] px-2 py-1 rounded-[5px] ${
                isChanged
                  ? "bg-[#1d1d1d] text-white hover:opacity-80"
                  : "bg-gray-300 text-gray-600"
              }`}
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
