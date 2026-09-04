'use client';

import React, { useEffect, useState } from 'react';

/**
 * The facts about the device and the browser window, for the demo route.
 *
 * The client reports layout problems from a phone we cannot see. This modal
 * puts the numbers the scaler works from on the screen, so a screenshot of it
 * says which phone, which browser page size, and which canvas scale the
 * client was looking at. Hardcoded English on purpose: it belongs to the demo
 * bar, which is not shipped.
 */
interface DemoDeviceInfoModalProps {
    open: boolean;
    onClose: () => void;
}

type Row = [label: string, value: string, note?: string];
type Section = { title: string; rows: Row[] };

const px = (n: number) => `${Math.round(n * 10) / 10} px`;

/** One CSS variable off :root, as the scaler wrote it. */
const rootVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/**
 * The safe-area insets, read through a probe element: `env()` has no JS API,
 * so a padding set from it is the only way to get the number.
 */
function safeAreaInsets() {
    const probe = document.createElement('div');
    probe.style.cssText =
        'position:fixed;visibility:hidden;pointer-events:none;' +
        'padding-top:env(safe-area-inset-top);padding-right:env(safe-area-inset-right);' +
        'padding-bottom:env(safe-area-inset-bottom);padding-left:env(safe-area-inset-left)';
    document.body.appendChild(probe);
    const s = getComputedStyle(probe);
    const out = { top: s.paddingTop, right: s.paddingRight, bottom: s.paddingBottom, left: s.paddingLeft };
    probe.remove();
    return out;
}

function readSections(): Section[] {
    const vv = window.visualViewport;
    const dpr = window.devicePixelRatio || 1;
    const inset = safeAreaInsets();
    const appScale = Number(rootVar('--app-scale')) || 1;
    const deficit = rootVar('--xd-flex-deficit') || '0px';
    const canvasHeight = rootVar('--app-canvas-height');
    const nav = navigator as Navigator & { userAgentData?: { platform?: string; mobile?: boolean } };
    const mq = (q: string) => window.matchMedia(q).matches;

    return [
        {
            title: 'Device screen',
            rows: [
                ['Screen size', `${screen.width} × ${screen.height}`, 'CSS px, the whole display'],
                ['Available size', `${screen.availWidth} × ${screen.availHeight}`, 'without the OS bars'],
                ['Device pixel ratio', `${dpr}`, `so ${Math.round(screen.width * dpr)} × ${Math.round(screen.height * dpr)} physical px`],
                ['Orientation', screen.orientation?.type ?? (screen.width > screen.height ? 'landscape' : 'portrait')],
                ['Touch points', `${navigator.maxTouchPoints}`, mq('(pointer: coarse)') ? 'coarse pointer (finger)' : 'fine pointer (mouse)'],
            ],
        },
        {
            title: 'Browser window',
            rows: [
                ['Page area', `${window.innerWidth} × ${window.innerHeight}`, 'innerWidth × innerHeight: what the scaler fits'],
                ['Outer window', `${window.outerWidth} × ${window.outerHeight}`, 'with the browser bars'],
                ['Bars take', px(window.outerHeight - window.innerHeight), 'outer minus inner height'],
                [
                    'Visual viewport',
                    vv ? `${px(vv.width)} × ${px(vv.height)}` : 'not supported',
                    vv ? `pinch zoom ${vv.scale.toFixed(2)}, offset top ${px(vv.offsetTop)}` : undefined,
                ],
                [
                    'Zoom (estimate)',
                    window.outerWidth && window.innerWidth
                        ? `${Math.round((window.outerWidth / window.innerWidth) * 100)} %`
                        : 'unknown',
                    'outer ÷ inner width; only meaningful on a desktop browser',
                ],
                ['Safe area insets', `top ${inset.top}, right ${inset.right}, bottom ${inset.bottom}, left ${inset.left}`],
                ['Display mode', mq('(display-mode: standalone)') ? 'standalone (home screen app)' : 'browser tab'],
            ],
        },
        {
            title: 'Design canvas (AppScaler)',
            rows: [
                ['Scale', appScale.toFixed(4), `1 design px = ${appScale.toFixed(3)} CSS px`],
                [
                    'Canvas drawn size',
                    `${px(430 * appScale)} × ${canvasHeight ? px(Number.parseFloat(canvasHeight)) : 'unknown'}`,
                    'CSS px',
                ],
                ['Deficit', px(Number.parseFloat(deficit) || 0), 'design px the screen gives up'],
                [
                    'Canvas height',
                    `${Math.round((932 - (Number.parseFloat(deficit) || 0)) * 10) / 10} design px`,
                    '932 minus the deficit',
                ],
                ['Keyboard lift', rootVar('--app-keyboard-lift') || '0px'],
            ],
        },
        {
            title: 'Preferences',
            rows: [
                ['Reduced motion', mq('(prefers-reduced-motion: reduce)') ? 'ON (animations are cut short)' : 'off'],
                ['Colour scheme', mq('(prefers-color-scheme: dark)') ? 'dark' : 'light'],
                ['Language', navigator.language],
            ],
        },
        {
            title: 'Browser',
            rows: [
                ['Platform', nav.userAgentData?.platform ?? navigator.platform],
                ['User agent', navigator.userAgent],
            ],
        },
    ];
}

export default function DemoDeviceInfoModal({ open, onClose }: DemoDeviceInfoModalProps) {
    const [sections, setSections] = useState<Section[]>([]);
    const [copied, setCopied] = useState<boolean>(false);

    // Read on open and again on every resize, so turning the phone or
    // hiding the browser bar updates the numbers while the modal is up.
    useEffect(() => {
        if (!open) return;
        const refresh = () => setSections(readSections());
        refresh();
        window.addEventListener('resize', refresh);
        window.visualViewport?.addEventListener('resize', refresh);
        window.visualViewport?.addEventListener('scroll', refresh);
        return () => {
            window.removeEventListener('resize', refresh);
            window.visualViewport?.removeEventListener('resize', refresh);
            window.visualViewport?.removeEventListener('scroll', refresh);
        };
    }, [open]);

    if (!open) return null;

    const asText = () =>
        sections
            .map((s) => `## ${s.title}\n` + s.rows.map(([l, v, n]) => `${l}: ${v}${n ? `  (${n})` : ''}`).join('\n'))
            .join('\n\n');

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(asText());
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            setCopied(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999999999999] flex items-center justify-center font-quicksand">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <div
                data-pw="demo-device-info-modal"
                className="relative w-[min(560px,94vw)] max-h-[88vh] flex flex-col bg-[#141414] text-white rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
            >
                <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-white/10">
                    <div>
                        <h2 className="text-base font-bold">Device and browser info</h2>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                            The numbers the layout is built from on this device. Copy them into a bug report.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-sm cursor-pointer"
                    >
                        ×
                    </button>
                </div>

                <div className="overflow-y-auto px-5 py-3 flex flex-col gap-4">
                    {sections.map((section) => (
                        <div key={section.title}>
                            <h3 className="text-[11px] uppercase tracking-wide text-[#8f80ff] font-bold mb-1.5">
                                {section.title}
                            </h3>
                            <table className="w-full text-[12px]">
                                <tbody>
                                    {section.rows.map(([label, value, note]) => (
                                        <tr key={label} className="border-t border-white/5 align-top">
                                            <td className="py-1 pr-3 text-gray-400 whitespace-nowrap w-[38%]">{label}</td>
                                            <td className="py-1 break-all">
                                                <span className="text-white">{value}</span>
                                                {note && <span className="block text-[10px] text-gray-500">{note}</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-white/10">
                    <button
                        onClick={copy}
                        className="px-3 py-1.5 rounded-lg text-[11px] bg-white/5 text-gray-200 hover:bg-white/15 cursor-pointer"
                    >
                        {copied ? 'Copied' : 'Copy as text'}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 rounded-lg text-[11px] font-bold bg-[#402CDD] hover:bg-[#3623c7] text-white cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
