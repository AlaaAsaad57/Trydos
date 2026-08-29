import type { PatternFactory } from '../types';
import { winkPattern } from './wink';
import { relayPattern } from './relay';
import { fireflyPattern } from './firefly';
import { canonPattern } from './canon';
import { tempoPattern } from './tempo';
import { sparkPattern } from './spark';
import { revealPattern } from './reveal';
import { gustPattern } from './gust';
import { escapePattern } from './escape';
import { swayPattern } from './sway';

/**
 * The patterns, by id.
 *
 * They are different motion languages rather than ten settings of one.
 * Two patterns that both "pulse a bit" give a client nothing to choose between,
 * which is what happened to the five this set replaced.
 *
 *   wink    character   the dots are eyes and behave like eyes
 *   relay   weight      a charge is thrown from one dot to the other and back
 *   firefly character   a sparkle flies a lap and the eyes follow it round
 *   canon   character   one eye leads, the other catches up and overshoots
 *   tempo   staccato    hard 58ms steps on a tresillo, silence in between
 *   spark   ambient     long mismatched periods, never repeats visibly
 *   reveal  build       assembles, holds, then takes itself apart again
 *   gust    wave        wind crosses, and the letters lean in sequence
 *   escape  comedy      a letter falls out of the word and is stared at
 *   sway    solid body  the whole mark hangs and swings, eyes trailing
 *
 * All ten loop for ever and land back on the static mark at the top of every
 * cycle.
 *
 * Every looping pattern runs on the same 4 second cycle, except `reveal`, which
 * runs on 4.5: it has to fit a build, a hold and the whole build again in
 * reverse, and squeezing that into 4 makes the hold too short to read.
 *
 * One more thing is deliberately off that cycle: the slow background turn some
 * of them give the badge ring. A ring that laps in 4 seconds is a loading
 * spinner, not a logo.
 *
 * All three elements of the logo take part in all of them: the dots, the word,
 * and — on the badge — the dotted ring. There are two ways the word joins in.
 * The first seven use `WordmarkEcho.tsx`, a tinted ghost of the word painted
 * behind the real letters, because back then the word was a single path and a
 * single path can only move as one lump. The last three set `letters`, which
 * draws the word as one group per letter so they can be staggered. Either way
 * no glyph is ever reshaped — see `logoPaths.ts` for how the split is made and
 * checked.
 */
export const LOGO_PATTERNS: Record<string, PatternFactory> = {
    wink: winkPattern,
    relay: relayPattern,
    firefly: fireflyPattern,
    canon: canonPattern,
    tempo: tempoPattern,
    spark: sparkPattern,
    reveal: revealPattern,
    gust: gustPattern,
    escape: escapePattern,
    sway: swayPattern,
};
