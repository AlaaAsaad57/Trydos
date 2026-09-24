// The hand-drawn QR code used by the QR login screen and the RDB payment modal.
// It draws the data modules as slightly uneven squares and the three finder
// patterns as rounded rings, from the real `qrcode` package's matrix.
import QRCodeLib from "qrcode";
import { describe, expect, it } from "vitest";

import CustomQRCode from "components/Login/Enhanced/ui/CustomQRCode";

import { render } from "../../../../render";

describe("CustomQRCode", () => {
  it("draws every dark data module and the three finder patterns", () => {
    const value = "trydos://qr-login/0123456789abcdef";
    const { container } = render(<CustomQRCode value={value} size={290} bg="#FFFFFF" />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("aria-label"), "the QR code has no readable label").toBe(`QR Code for ${value}`);
    expect(svg.getAttribute("viewBox"), "the size was not used").toBe("0 0 290 290");

    const qr = QRCodeLib.create(value, { errorCorrectionLevel: "L" });
    const n = qr.modules.size;
    let darkOutsideFinders = 0;
    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        const inFinder =
          (row < 8 && col < 8) || (row < 8 && col >= n - 8) || (row >= n - 8 && col < 8);
        if (!inFinder && qr.modules.data[row * n + col] === 1) darkOutsideFinders++;
      }
    }
    expect(
      container.querySelectorAll("path").length === darkOutsideFinders,
      "the drawn dots do not match the dark modules of the QR matrix",
    ).toBe(true);
    const rings = container.querySelectorAll('rect[stroke="black"]');
    const cores = container.querySelectorAll('rect[fill="black"]');
    expect(rings.length === 3 && cores.length === 3, "the three finder patterns are not all drawn").toBe(true);
    expect(
      container.querySelectorAll('rect[fill="#FFFFFF"]').length === 4,
      "the background and the three finder clearings do not use the given colour",
    ).toBe(true);
  });

  it("uses the default size and background", () => {
    const { container } = render(<CustomQRCode value="x" />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("width"), "the default size is not 232").toBe("232");
    expect(container.querySelector("rect")!.getAttribute("fill"), "the default background is wrong").toBe("#FCFCFC");
  });

  it("leaves an empty box of the right size when the value cannot be encoded", () => {
    const { container } = render(<CustomQRCode value="" size={100} />);
    expect(container.querySelector("svg"), "an unencodable value still drew a QR").toBeNull();
    const box = container.firstElementChild as HTMLElement;
    expect(box.style.width, "the empty box is not the QR size").toBe("100px");
  });
});
