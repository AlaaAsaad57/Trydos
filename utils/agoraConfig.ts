// The Agora App ID, read in one place for every call screen.
//
// It used to be hardcoded in four files, and one copy ended in a different
// character, so a voice call from the mobile app could not join the channel
// (readiness A2-24, A2-25). `NEXT_PUBLIC_AGORA_APP_ID` lets production point at
// its own Agora project. Without it the staging project is used, so local and
// preview builds can still make calls. Ops sets the production value.
const STAGING_AGORA_APP_ID = "0af959943ff542df8f2cb1b925ec0cc4";

export const AGORA_APP_ID =
  process.env.NEXT_PUBLIC_AGORA_APP_ID?.trim() || STAGING_AGORA_APP_ID;
