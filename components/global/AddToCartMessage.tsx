import React from "react";
import {
  showErrorNotification,
  showSuccessNotification,
} from "store/notifications/reducer";

const SuccessIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15.3"
    height="15.3"
    viewBox="0 0 15.3 15.3"
  >
    <g id="Group_3290" data-name="Group 3290" transform="translate(0.15 0.15)">
      <g
        id="Group_3166"
        data-name="Group 3166"
        transform="translate(4.911 5.253)"
      >
        <g id="Group_3165" data-name="Group 3165">
          <path
            id="Path_15412"
            data-name="Path 15412"
            d="M133.912,136.19a.642.642,0,0,0-.908,0l-2.756,2.755-1.151-1.151a.642.642,0,1,0-.908.908l1.6,1.6a.642.642,0,0,0,.908,0l3.21-3.21A.642.642,0,0,0,133.912,136.19Z"
            transform="translate(-128.002 -136.002)"
            fill="#37ef9a"
            stroke="#404040"
            strokeWidth="0.3"
          />
        </g>
      </g>
      <path
        id="Path_15413"
        data-name="Path 15413"
        d="M14.375,6.875a.625.625,0,0,0-.625.625,6.25,6.25,0,1,1-1.815-4.4.625.625,0,1,0,.887-.881A7.5,7.5,0,1,0,15,7.5.625.625,0,0,0,14.375,6.875Z"
        transform="translate(0 0)"
        fill="#37ef9a"
        stroke="#2c2a2a"
        strokeWidth="0.3"
      />
    </g>
  </svg>
);

const ErrorIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    viewBox="0 0 15 15"
  >
    <g
      id="Group_14012"
      data-name="Group 14012"
      transform="translate(-108 -504)"
    >
      <path
        id="Ellipse_553"
        data-name="Ellipse 553"
        d="M7.5.4a7.1,7.1,0,1,0,7.1,7.1A7.108,7.108,0,0,0,7.5.4m0-.4A7.5,7.5,0,1,1,0,7.5,7.5,7.5,0,0,1,7.5,0Z"
        transform="translate(108 504)"
        fill="#8d8d8d"
      />
      <g
        id="Group_14008"
        data-name="Group 14008"
        transform="translate(114.571 505.669)"
      >
        <path
          id="Path_23445"
          data-name="Path 23445"
          d="M10.217,14.738c-.538,0-.979-.655-1-1.484l-.1-4.392a2.028,2.028,0,0,1,.537-1.512.78.78,0,0,1,1.118,0,2.028,2.028,0,0,1,.537,1.512l-.1,4.392C11.2,14.084,10.755,14.741,10.217,14.738Zm0-6.789a.488.488,0,0,0-.4.261,1.148,1.148,0,0,0-.155.624l.1,4.392c.009.376.209.673.453.673s.444-.3.453-.673l.1-4.392a1.148,1.148,0,0,0-.155-.624A.488.488,0,0,0,10.217,7.95Z"
          transform="translate(-9.12 -7.114)"
          fill="#ff5f61"
        />
        <path
          id="Path_23446"
          data-name="Path 23446"
          d="M10.138,15.119A1.055,1.055,0,0,1,9.2,13.979a1.055,1.055,0,0,1,.939-1.141,1.055,1.055,0,0,1,.939,1.141,1.056,1.056,0,0,1-.939,1.141Zm0-1.674a.544.544,0,0,0,0,1.067.544.544,0,0,0,0-1.067Z"
          transform="translate(-9.039 -4.671)"
          fill="#ff5f61"
        />
      </g>
    </g>
  </svg>
);

const createToastElement = (message: string, type: "success" | "error") => {
  // Create container
  const toast = document.createElement("div");
  toast.className = "toast-message";
  toast.setAttribute("role", "alert");
  toast.setAttribute("aria-live", "polite");

  // Create inner content
  const content = document.createElement("div");
  content.className = "toast-content";

  // Create icon container
  const iconContainer = document.createElement("div");
  iconContainer.className = "toast-icon";
  iconContainer.innerHTML =
    type === "success"
      ? '<svg xmlns="http://www.w3.org/2000/svg" width="15.3" height="15.3" viewBox="0 0 15.3 15.3"><g transform="translate(0.15 0.15)"><g transform="translate(4.911 5.253)"><g><path d="M133.912,136.19a.642.642,0,0,0-.908,0l-2.756,2.755-1.151-1.151a.642.642,0,1,0-.908.908l1.6,1.6a.642.642,0,0,0,.908,0l3.21-3.21A.642.642,0,0,0,133.912,136.19Z" transform="translate(-128.002 -136.002)" fill="#37ef9a" stroke="#404040" strokeWidth="0.3"/></g></g><path d="M14.375,6.875a.625.625,0,0,0-.625.625,6.25,6.25,0,1,1-1.815-4.4.625.625,0,1,0,.887-.881A7.5,7.5,0,1,0,15,7.5.625.625,0,0,0,14.375,6.875Z" fill="#37ef9a" stroke="#2c2a2a" strokeWidth="0.3"/></g></svg>'
      : '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15"><g transform="translate(-108 -504)"><path d="M7.5.4a7.1,7.1,0,1,0,7.1,7.1A7.108,7.108,0,0,0,7.5.4m0-.4A7.5,7.5,0,1,1,0,7.5,7.5,7.5,0,0,1,7.5,0Z" transform="translate(108 504)" fill="#8d8d8d"/><g transform="translate(114.571 505.669)"><path d="M10.217,14.738c-.538,0-.979-.655-1-1.484l-.1-4.392a2.028,2.028,0,0,1,.537-1.512.78.78,0,0,1,1.118,0,2.028,2.028,0,0,1,.537,1.512l-.1,4.392C11.2,14.084,10.755,14.741,10.217,14.738Zm0-6.789a.488.488,0,0,0-.4.261,1.148,1.148,0,0,0-.155.624l.1,4.392c.009.376.209.673.453.673s.444-.3.453-.673l.1-4.392a1.148,1.148,0,0,0-.155-.624A.488.488,0,0,0,10.217,7.95Z" transform="translate(-9.12 -7.114)" fill="#ff5f61"/><path d="M10.138,15.119A1.055,1.055,0,0,1,9.2,13.979a1.055,1.055,0,0,1,.939-1.141,1.055,1.055,0,0,1,.939,1.141,1.056,1.056,0,0,1-.939,1.141Zm0-1.674a.544.544,0,0,0,0,1.067.544.544,0,0,0,0-1.067Z" transform="translate(-9.039 -4.671)" fill="#ff5f61"/></g></g></svg>';

  // Create message
  const messageEl = document.createElement("span");
  messageEl.className = "toast-text";
  messageEl.textContent = message;
  content.onclick = () => {
    dismissToast(toast);
  };

  // Append elements
  content.appendChild(iconContainer);
  content.appendChild(messageEl);
  toast.appendChild(content);
  let bottom = 100;
  if (document.querySelector(".product_details_addtocart"))
    bottom =
      (document.querySelector(".product_details_addtocart") as HTMLDivElement)
        .clientHeight - 5;

  // Add styles
  const styles = `
		.toast-message.show {
    left: 0;
    opacity: 1;
    width: 100%;
    margin: 0 auto;
    right: 0;
}
.toast-message {
    position: absolute;
   display:flex;
   justify-content:center;
    border-top-left-radius: 20px;
    border-top-right-radius: 20px;
    padding: 12px 20px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 999;
    cursor: pointer;
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    max-width: 96%;
    min-width: 250px;
}
		
		.toast-message.hide {
			transform: translateX(-50%) translateY(100px);
			opacity: 0;
		}
		
		.toast-content {
			display: flex;
			align-items: center;
			gap: 12px;
		}
		
		.toast-icon {
			display: flex;
			align-items: center;
			justify-content: center;
			shrink: 0;
		}
		
		.toast-text {
			font-size: 14px;
			color: #3C3C3C;
			font-family: var(--Quicksand-Regular);
		}
	`;

  // Add styles if not already added
  if (!document.getElementById("toast-styles")) {
    const styleSheet = document.createElement("style");
    styleSheet.id = "toast-styles";
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }
  Object.assign(toast.style, {
    bottom: `${bottom ?? 0}px`,
    "background-color": type === "success" ? "#CEFFE6" : "#FFEDE2",
  });
  return toast;
};

const showToast = (message: string, type: "success" | "error") => {
  const toast = createToastElement(message, type);
  if (document.body.querySelector(".message-add-to-cart"))
    document.body.querySelector(".message-add-to-cart").appendChild(toast);
  else document.body.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    if (document.querySelector(".color_option_cyrcle")) {
      (
        document.querySelector(".color_option_cyrcle") as HTMLDivElement
      ).classList.add("hidden");
      (
        document.querySelector(".color_option_cyrcle") as HTMLDivElement
      ).classList.remove("flex");
    }
    toast.classList.add("show");
  });

  // Auto dismiss after 5 seconds
  const timeoutId = setTimeout(() => {
    dismissToast(toast);
  }, 3000);

  // Click to dismiss
  toast.addEventListener("click", () => {
    clearTimeout(timeoutId);
    dismissToast(toast);
  });
};

const dismissToast = (toast: HTMLElement) => {
  toast.classList.remove("show");
  toast.classList.add("hide");
  if (document.querySelector(".color_option_cyrcle")) {
    (
      document.querySelector(".color_option_cyrcle") as HTMLDivElement
    ).classList.add("flex");
    (
      document.querySelector(".color_option_cyrcle") as HTMLDivElement
    ).classList.remove("hidden");
  }
  // Remove from DOM after animation
  setTimeout(() => {
    toast.remove();
  }, 300);
};

export const showSuccessMessage = (message: string) => {
  if (document.querySelector(".message-add-to-cart "))
    showToast(message, "success");
  else showSuccessNotification(message);
};

export const showErrorMessage = (message: string) => {
  if (document.querySelector(".message-add-to-cart "))
    showToast(message, "error");
  else showErrorNotification(message);
};
