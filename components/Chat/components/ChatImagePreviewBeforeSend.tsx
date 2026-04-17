import Image from "next/image";
import React from "react";
import { translateFunction } from "utils/functions";

function ChatImagePreviewBeforeSend({
  handleImagePreviewCancel,
  croppedImagePreview,
  handleImagePreviewSend,
}) {
  return (
    <div className="fixed inset-0 bg-[#00000067] flex items-center justify-center z-9999999999">
      <div className="bg-white rounded-lg w-[90%] max-w-2xl max-h-[90vh] overflow-hidden flex flex-col items-end">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {translateFunction("Preview")}
          </h2>
          <button
            onClick={handleImagePreviewCancel}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            aria-label={translateFunction("Close")}
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 flex items-center justify-center w-full">
          <div className="w-full flex flex-col items-center gap-4">
            <div className="relative w-full ">
              <Image
                src={croppedImagePreview}
                alt="Cropped preview"
                width={800}
                height={800}
                className="w-full h-auto rounded-lg object-contain max-h-[75vh]"
              />
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-end gap-3 w-full">
          <button
            onClick={handleImagePreviewCancel}
            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {translateFunction("Cancel")}
          </button>
          <button
            onClick={handleImagePreviewSend}
            className="px-6 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
          >
            {translateFunction("Send") || "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatImagePreviewBeforeSend;
