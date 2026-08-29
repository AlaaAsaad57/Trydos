import type { PatternFactory } from '../types';
import { winkPattern } from './wink';
import { relayPattern } from './relay';
import { fireflyPattern } from './firefly';
import { canonPattern } from './canon';
import { tempoPattern } from './tempo';
import { sparkPattern } from './spark';
import { revealPattern } from './reveal';

/**
 * The patterns, by id.
 *
 * They are different motion languages rather than seven settings of one.
 * Two patterns that both "pulse a bit" give a client nothing to choose between,
 * which is what happened to the five this set replaced.
 *
 *   wink    character   the dots are eyes and behave like eyes
 *   relay   weight      a charge is thrown from one dot to the other and back
 *   firefly character   a sparkle flies a lap and the eyes follow it round
 *   canon   character   one eye leads, the other catches up and overshoots
 *   tempo   staccato    hard 58ms steps on a tresillo, silence in between
 *   spark   ambient     long mismatched periods, never repeats visibly
 *   reveal  entrance    plays once on mount, then perfectly still
 *
 * All but one loop for ever and land back on the static mark at the top of
 * every cycle. `reveal` is the exception, and it is the exception on purpose.
 *
 * All three elements of the logo take part in all of them: the dots, the word,
 * and — on the badge — the dotted ring. The word is the awkward one, because no
 * pattern may transform a glyph; see `WordmarkEcho.tsx` for how it joins in
 * without one being touched.
 */
export const LOGO_PATTERNS: Record<string, PatternFactory> = {
    wink: winkPattern,
    relay: relayPattern,
    firefly: fireflyPattern,
    canon: canonPattern,
    tempo: tempoPattern,
    spark: sparkPattern,
    reveal: revealPattern,
};
