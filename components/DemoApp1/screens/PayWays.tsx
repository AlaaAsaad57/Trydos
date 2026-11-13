"use client";

import React from "react";
import { motion } from "framer-motion";
import { WALLET_CASH_IN_WAYS } from "../../DemoApp/demoWallet";
import type { DemoKey } from "../../DemoApp/demoKeys";
import { C, gapTo } from "../demo1Layout";
import { Box, Icon, Txt } from "../ui";

/**
 * The row of five 125 px tiles, 8 apart, that slides sideways, as the file's
 * scroll group does: the cards ("Soon Available", its tag 76 x 19 hangs 9 px
 * over the tile's bottom edge), crypto, and the photos of Sham Cash, Syriatel
 * Cash and Irsal. The wallet's ways to cash in (`Home Page – 22`, tiles at
 * y 534) and the checkout's payment sheet (`– 73`, tiles at y 604) draw the
 * same row.
 *
 * `mt`: from the block above to the tiles' top edge. The row itself starts
 * 1 px higher, so the outer half of the tiles' lines (ON the edge) is not cut
 * off by the row's own edge.
 */
export default function PayWays({
  mt,
  t,
  testId,
  onCrypto,
}: {
  mt: number;
  t: (key: DemoKey) => string;
  /** The `data-pw` names: the row, a tile (`<way>-<id>`, as `<way>-crypto`) and the "Soon Available" tag. */
  testId: { row: string; way: string; soon: string };
  /** A tap on the crypto tile. The other tiles take no tap yet. */
  onCrypto?: () => void;
}) {
  return (
    <div
      data-pw={testId.row}
      className="flex shrink-0 overflow-x-auto overflow-y-hidden overscroll-x-contain"
      style={{
        marginTop: mt - 1,
        paddingTop: 1,
        height: 1 + TILE_ROW_H,
        scrollbarWidth: "none",
      }}
    >
      {WALLET_CASH_IN_WAYS.map((way, i) => (
        <div
          key={way.id}
          className="flex flex-col shrink-0"
          style={{
            marginLeft: i === 0 ? 20 : 8,
            // The row ends 20 px after the last tile, as it starts.
            marginRight: i === WALLET_CASH_IN_WAYS.length - 1 ? 20 : 0,
          }}
        >
          <motion.button
            type="button"
            aria-label={
              way.name === "Visa | Mastercard" ? way.name : t(way.name)
            }
            data-pw={`${testId.way}-${way.id}`}
            onClick={way.id === "crypto" ? onCrypto : undefined}
            disabled={way.soon}
            whileTap={way.soon ? undefined : { scale: 0.97 }}
            className={`shrink-0 ${way.soon ? "" : "cursor-pointer"}`}
          >
            <Box
              w={125}
              h={125}
              radius={15}
              fill={C.card}
              stroke={C.line}
              strokeAlign="center"
              style={{ padding: 12 }}
            >
              {way.icon ? (
                <Box
                  w={101}
                  h={101}
                  radius={15}
                  fill={C.white}
                  stroke={C.line}
                  strokeAlign="center"
                >
                  <Icon name={way.icon} />
                </Box>
              ) : (
                <img
                  src={`/assets/demo/xd/${way.picture}.jpg`}
                  alt=""
                  draggable={false}
                  width={101}
                  height={101}
                  className="block object-cover select-none pointer-events-none"
                  style={{ width: 101, height: 101, borderRadius: 15 }}
                />
              )}
            </Box>
          </motion.button>
          {way.soon && (
            // The tag hangs 9 px over the tile's bottom edge.
            <Box
              w={76}
              h={19}
              mt={TAG_Y - TILE}
              ml={45 - 20}
              radius={6.8}
              fill={C.card}
              stroke={C.hint}
              data-pw={testId.soon}
              className="flex flex-col"
            >
              <Txt center size={9} mt={gapTo(0, TAG_BASELINE, 9)}>
                {t("Soon available")}
              </Txt>
            </Box>
          )}
        </div>
      ))}
    </div>
  );
}

/** A tile's size, the tag's top from the tile's top (y 534 → 650 on `– 22`) and its word's baseline in the tag. */
const TILE = 125;
const TAG_Y = 650 - 534;
const TAG_BASELINE = 663 - 650;

/** From the tiles' top to the tag's bottom edge (534 → 669 on `– 22`). */
export const TILE_ROW_H = TAG_Y + 19;
