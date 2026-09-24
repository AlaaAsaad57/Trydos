'use client';

import React, { useEffect, useState } from 'react';
import { LOGO_ANIMATION_PRESETS, clampLogoDuration } from './LogoAnimationContext';
import type { LogoAnimationType } from './LogoAnimationContext';
import { DEFAULT_LOGO_CONFIG, LOGO_SLOTS, cloneLogoConfig } from './logoScreenConfig';
import type { LogoConfig, LogoSlotConfig, LogoSlotId } from './logoScreenConfig';

/**
 * The picker, one row per logo in the flow.
 *
 * It replaces the single global pattern the demo bar used to hold. That control
 * could only ever answer "which one animation for the whole flow", which is not
 * the question being asked: the design gives the Quick Preview, Get Started and
 * Terms different motion on purpose, and the point is to compare those side by
 * side rather than guess.
 *
 * Edits go into a draft. Apply hands it up, Cancel throws it away, so the client
 * can try a combination and back out of it. Copy puts the whole thing on the
 * clipboard as JSON, to send on.
 *
 * Demo only, on a route nothing links to, so the text here is English and is not
 * translated. The Flow Steps strip beside it is the same.
 */

interface LogoAnimationModalProps {
    open: boolean;
    config: LogoConfig;
    /** Highlighted, so the client can see which row he is watching. */
    currentSlot: LogoSlotId;
    onApply: (config: LogoConfig) => void;
    onClose: () => void;
}

const FIELD =
    'bg-white/10 border border-white/15 rounded-md text-[11px] text-white outline-none focus:ring-1 focus:ring-[#402CDD]';

export default function LogoAnimationModal({
    open,
    config,
    currentSlot,
    onApply,
    onClose,
}: LogoAnimationModalProps) {
    const [draft, setDraft] = useState<LogoConfig>(() => cloneLogoConfig(config));
    const [copyState, setCopyState] = useState<'idle' | 'done' | 'failed'>('idle');

    // Every opening starts from what is actually playing, so a cancelled edit
    // from last time cannot come back.
    useEffect(() => {
        if (open) {
            setDraft(cloneLogoConfig(config));
            setCopyState('idle');
        }
    }, [open, config]);

    if (!open) return null;

    const editSlot = (id: LogoSlotId, change: (slot: LogoSlotConfig) => LogoSlotConfig) =>
        setDraft((prev) => ({ ...prev, [id]: change(prev[id]) }));

    const setStep = (
        id: LogoSlotId,
        index: number,
        patch: Partial<{ animation: LogoAnimationType; seconds: number }>,
    ) =>
        editSlot(id, (slot) => ({
            ...slot,
            steps: slot.steps.map((step, i) => (i === index ? { ...step, ...patch } : step)),
        }));

    const addStep = (id: LogoSlotId) =>
        editSlot(id, (slot) => ({
            ...slot,
            steps: [...slot.steps, { animation: 'wink' as LogoAnimationType, seconds: 5 }],
        }));

    const removeStep = (id: LogoSlotId, index: number) =>
        editSlot(id, (slot) => ({
            ...slot,
            // Never leave a slot with no steps. An empty list has no meaning,
            // and there would be no way back to a pattern from this screen.
            steps: slot.steps.length > 1 ? slot.steps.filter((_, i) => i !== index) : slot.steps,
        }));

    const copyJson = async () => {
        try {
            await navigator.clipboard.writeText(JSON.stringify(draft, null, 2));
            setCopyState('done');
        } catch {
            // Some browsers refuse the clipboard outright — over plain http, or
            // without permission. Saying so beats a button that looks broken:
            // the client presses it, nothing happens, and nothing says why.
            setCopyState('failed');
        }
    };

    return (
        <div className="fixed inset-0 z-[9999999999999] flex items-center justify-center font-quicksand">
            {/* Clicking away is the same as Cancel: the draft is dropped. */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-[min(680px,94vw)] max-h-[88vh] flex flex-col bg-[#141414] text-white rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <div>
                        <div className="text-sm font-bold">Logo animation per screen</div>
                        <div className="text-[11px] text-gray-400">
                            Add steps to play one animation after another. With the loop on, the
                            last step keeps going. Turn it off to stop on the plain logo.
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-sm cursor-pointer"
                        aria-label="Close"
                    >
                        &times;
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
                    {LOGO_SLOTS.map(({ id, label, note }) => {
                        const slot = draft[id];
                        const isCurrent = id === currentSlot;
                        return (
                            <div
                                key={id}
                                className={`rounded-xl border p-2.5 transition-colors ${
                                    isCurrent
                                        ? 'border-[#402CDD] bg-[#402CDD]/10'
                                        : 'border-white/10 bg-white/5'
                                }`}
                            >
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <div className="text-[12px] font-semibold">
                                        {label}
                                        {note && (
                                            <span className="text-[10px] text-gray-400 font-normal">
                                                {' '}
                                                &mdash; {note}
                                            </span>
                                        )}
                                        {isCurrent && (
                                            <span className="ml-2 text-[10px] text-[#A688FA]">
                                                on screen now
                                            </span>
                                        )}
                                    </div>
                                    <label className="flex items-center gap-1.5 text-[11px] text-gray-300 cursor-pointer whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            checked={slot.loop}
                                            onChange={(event) =>
                                                editSlot(id, (current) => ({
                                                    ...current,
                                                    loop: event.target.checked,
                                                }))
                                            }
                                            className="accent-[#402CDD] cursor-pointer"
                                        />
                                        Loop
                                    </label>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    {slot.steps.map((step, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <span className="text-[11px] text-gray-500 w-3">
                                                {index + 1}
                                            </span>
                                            <select
                                                value={step.animation}
                                                onChange={(event) =>
                                                    setStep(id, index, {
                                                        animation: event.target
                                                            .value as LogoAnimationType,
                                                    })
                                                }
                                                className={`${FIELD} flex-1 min-w-0 px-2 py-1 cursor-pointer`}
                                            >
                                                {LOGO_ANIMATION_PRESETS.map((preset) => (
                                                    <option
                                                        key={preset.id}
                                                        value={preset.id}
                                                        className="bg-[#141414]"
                                                    >
                                                        {preset.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <input
                                                type="number"
                                                min={1}
                                                max={20}
                                                step={1}
                                                value={step.seconds}
                                                disabled={step.animation === 'none'}
                                                onChange={(event) =>
                                                    setStep(id, index, {
                                                        seconds: clampLogoDuration(
                                                            Number(event.target.value),
                                                        ),
                                                    })
                                                }
                                                className={`${FIELD} w-12 px-1.5 py-1 text-center disabled:opacity-40`}
                                            />
                                            <span className="text-[11px] text-gray-400">s</span>
                                            <button
                                                onClick={() => removeStep(id, index)}
                                                disabled={slot.steps.length === 1}
                                                title={
                                                    slot.steps.length === 1
                                                        ? 'A screen needs at least one step'
                                                        : 'Remove this step'
                                                }
                                                className="w-6 h-6 rounded-md bg-white/5 hover:bg-white/15 text-[11px] cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
                                            >
                                                &minus;
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => addStep(id)}
                                        className="self-start px-2 py-0.5 rounded-md text-[11px] bg-white/5 text-gray-300 hover:bg-white/15 hover:text-white cursor-pointer"
                                    >
                                        + add step
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-white/10">
                    <button
                        onClick={() => setDraft(cloneLogoConfig(DEFAULT_LOGO_CONFIG))}
                        className="px-3 py-1.5 rounded-lg text-[11px] bg-white/5 text-gray-300 hover:bg-white/15 hover:text-white cursor-pointer"
                    >
                        Reset to defaults
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={copyJson}
                            className="px-3 py-1.5 rounded-lg text-[11px] bg-white/5 text-gray-200 hover:bg-white/15 cursor-pointer"
                        >
                            {copyState === 'done'
                                ? 'Copied'
                                : copyState === 'failed'
                                  ? 'Copy blocked'
                                  : 'Copy JSON'}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-3 py-1.5 rounded-lg text-[11px] bg-white/5 text-gray-200 hover:bg-white/15 cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => onApply(cloneLogoConfig(draft))}
                            className="px-4 py-1.5 rounded-lg text-[11px] font-bold bg-[#402CDD] hover:bg-[#3623c7] text-white cursor-pointer"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
