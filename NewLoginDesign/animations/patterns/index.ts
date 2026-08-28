import type { PatternFactory } from '../types';
import { winkPattern } from './wink';
import { bouncePattern } from './bounce';
import { magnetPattern } from './magnet';
import { wavePattern } from './wave';
import { cometPattern } from './comet';
import { radarPattern } from './radar';
import { sparkPattern } from './spark';
import { revealPattern } from './reveal';

/**
 * The eight patterns, by id.
 *
 * They are deliberately eight different motion languages rather than eight
 * settings of one. Two patterns that both "pulse a bit" give a client nothing
 * to choose between:
 *
 *   wink    character      the dots are eyes and behave like eyes
 *   bounce  gravity        weight, squash on landing, follow-through
 *   magnet  spring         tension built, held, then released
 *   wave    fluid          one sine crossing the mark, volume kept
 *   comet   moving light   the mark holds still, the light travels
 *   radar   instrument     fixed rate, linear timing, the mark answers
 *   spark   ambient        long mismatched periods, never repeats visibly
 *   reveal  entrance       plays once on mount, then perfectly still
 */
export const LOGO_PATTERNS: Record<string, PatternFactory> = {
    wink: winkPattern,
    bounce: bouncePattern,
    magnet: magnetPattern,
    wave: wavePattern,
    comet: cometPattern,
    radar: radarPattern,
    spark: sparkPattern,
    reveal: revealPattern,
};
