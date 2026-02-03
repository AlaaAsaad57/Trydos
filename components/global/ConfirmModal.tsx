import { translateFunction } from "utils/functions";
import Spinner from "./Spinner";

export const ConfirmModal = ({
  onCancel,
  onConfirm,
  loading,
  type,
  showModal,
  confirmMessage,
  confirmTilte,
}) => {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30"
      style={{ zIndex: 999999999999999 }}
    >
      <div
        className={
          `fixed top-1/2 left-1/2 -translate-y-1/2 transition-transform duration-500 ease-in-out ` +
          (showModal ? "-translate-x-1/2" : "-translate-x-full") +
          " bg-white  rounded-lg shadow-lg p-8 flex flex-col items-center w-[90vw] max-w-[500px]"
        }
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
      >
        <h2
          id="delete-modal-title"
          className="text-lg font-semibold mb-4 text-gray-900 "
        >
          {translateFunction(confirmTilte)}
        </h2>
        <p className={`mb-6 text-gray-700 text-[13px]`}>
          {translateFunction(confirmMessage)}
        </p>
        <div className="flex gap-4 w-full justify-center min-h-[40px]">
          {loading ? (
            <Spinner />
          ) : (
            <>
              <button
                className="px-4 py-2 rounded-sm bg-gray-200  text-gray-800  hover:bg-gray-300  focus:outline-hidden focus:ring-2 focus:ring-gray-400"
                onClick={onCancel}
                tabIndex={0}
                aria-label={
                  type === "Delete" ? "Cancel delete" : "Cancel report"
                }
              >
                {translateFunction("Cancel")}
              </button>
              <button
                className="px-4 py-2 rounded-sm bg-red-600 text-white hover:bg-red-700 focus:outline-hidden focus:ring-2 focus:ring-red-400"
                onClick={onConfirm}
                tabIndex={0}
                aria-label={
                  type === "Delete" ? "Confirm delete" : "Confirm report"
                }
              >
                {translateFunction("Confirm")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
