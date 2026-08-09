'use client';

import { JSX, useMemo } from 'react';
import QRCodeLib from 'qrcode';

interface CustomQRCodeProps {
    value: string;
    size?: number;
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    bg?: string;
}

function isFinderZone(row: number, col: number, moduleCount: number): boolean {
    if (row < 8 && col < 8) return true;
    if (row < 8 && col >= moduleCount - 8) return true;
    if (row >= moduleCount - 8 && col < 8) return true;
    return false;
}

export function CustomQRCode({
    value,
    size = 232,
    errorCorrectionLevel = 'L',
    bg = '#FCFCFC',
}: CustomQRCodeProps) {
    const svgElements = useMemo(() => {
        let qr;
        try {
            qr = QRCodeLib.create(value, { errorCorrectionLevel });
        } catch {
            return null;
        }

        const moduleCount = qr.modules.size;
        const data = qr.modules.data;
        const moduleSize = size / moduleCount;
        const elements: JSX.Element[] = [];

        for (let row = 0; row < moduleCount; row++) {
            for (let col = 0; col < moduleCount; col++) {
                if (isFinderZone(row, col, moduleCount)) continue;
                if (data[row * moduleCount + col] !== 1) continue;

                const x = col * moduleSize;
                const y = row * moduleSize;
                const s = moduleSize * 0.95;
                const cx = x + moduleSize / 2;
                const cy = y + moduleSize / 2;
                const hs = s / 2;

                const variant = (row * 7 + col * 13 + row * col) % 8;

                let d: string;
                switch (variant) {
                    case 0:
                        d = `M${cx - hs + 0.5},${cy - hs}L${cx + hs},${cy - hs - 0.3}L${cx + hs - 0.5},${cy + hs}L${cx - hs},${cy + hs + 0.3}Z`;
                        break;
                    case 1:
                        d = `M${cx - hs},${cy - hs + 0.5}L${cx + hs - 0.3},${cy - hs}L${cx + hs},${cy + hs - 0.5}L${cx - hs + 0.3},${cy + hs}Z`;
                        break;
                    case 2:
                        d = `M${cx - hs + 0.8},${cy - hs}L${cx + hs},${cy - hs + 0.6}L${cx + hs - 0.8},${cy + hs}L${cx - hs},${cy + hs - 0.6}Z`;
                        break;
                    case 3:
                        d = `M${cx - hs + 0.3},${cy - hs}L${cx + hs},${cy - hs + 0.2}L${cx + hs - 0.3},${cy + hs}L${cx - hs},${cy + hs - 0.2}Z`;
                        break;
                    case 4:
                        d = `M${cx - hs},${cy - hs + 0.4}L${cx + hs},${cy - hs}L${cx + hs},${cy + hs - 0.4}L${cx - hs},${cy + hs}Z`;
                        break;
                    case 5:
                        d = `M${cx - hs + 0.6},${cy - hs}L${cx + hs},${cy - hs + 0.4}L${cx + hs - 0.6},${cy + hs}L${cx - hs},${cy + hs - 0.4}Z`;
                        break;
                    case 6:
                        d = `M${cx - hs},${cy - hs + 0.7}L${cx + hs - 0.5},${cy - hs}L${cx + hs},${cy + hs - 0.7}L${cx - hs + 0.5},${cy + hs}Z`;
                        break;
                    default:
                        d = `M${cx - hs + 0.4},${cy - hs + 0.1}L${cx + hs - 0.1},${cy - hs + 0.4}L${cx + hs - 0.4},${cy + hs - 0.1}L${cx - hs + 0.1},${cy + hs - 0.4}Z`;
                        break;
                }

                elements.push(<path key={`d-${row}-${col}`} d={d} fill="black" />);
            }
        }

        const finderSize = 7 * moduleSize;
        const outerR = finderSize * 0.33;
        const strokeW = moduleSize * 0.85;
        const coreSize = 3 * moduleSize;
        const corePad = (finderSize - coreSize) / 2;
        const coreR = coreSize * 0.25;

        const finders = [
            { x: 0, y: 0 },
            { x: (moduleCount - 7) * moduleSize, y: 0 },
            { x: 0, y: (moduleCount - 7) * moduleSize },
        ];

        finders.forEach((pos, i) => {
            elements.push(
                <rect
                    key={`fb-${i}`}
                    x={pos.x - moduleSize * 0.5}
                    y={pos.y - moduleSize * 0.5}
                    width={finderSize + moduleSize}
                    height={finderSize + moduleSize}
                    fill={bg}
                />,
            );
            elements.push(
                <rect
                    key={`fo-${i}`}
                    x={pos.x + strokeW / 2}
                    y={pos.y + strokeW / 2}
                    width={finderSize - strokeW}
                    height={finderSize - strokeW}
                    rx={outerR}
                    ry={outerR}
                    fill="none"
                    stroke="black"
                    strokeWidth={strokeW}
                />,
            );
            elements.push(
                <rect
                    key={`fc-${i}`}
                    x={pos.x + corePad}
                    y={pos.y + corePad}
                    width={coreSize}
                    height={coreSize}
                    rx={coreR}
                    ry={coreR}
                    fill="black"
                />,
            );
        });

        return elements;
    }, [value, size, errorCorrectionLevel, bg]);

    if (!svgElements) {
        return <div style={{ width: size, height: size }} />;
    }

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            role="img"
            aria-label={`QR Code for ${value}`}
        >
            <rect width={size} height={size} fill={bg} />
            {svgElements}
        </svg>
    );
}

export default CustomQRCode;
