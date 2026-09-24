// Answers the request layer (`utils/fetchData.ts`) never puts on screen.
//
// Its own module, not a `fetchData` export, because the caller that needs it —
// `services/auth.ts`, to know whether the shopper was already told about a
// refused save — is tested with `utils/fetchData` replaced by a stand-in, and a
// stand-in does not carry the list.

export const ignoredMessages = [
  "Data Got!",
  "Data Got",
  "تم الحصول على البيانات!",
  "Veri Alındı!",
  "Success",
  "Country and language updated successfully",
  "Product created and view count initialized",
  "View count updated",
  "Subscribed successfully",
  "signal is aborted without reason",
  "Failed to fetch",
  "Too many attempts",
  "Unauthorized",
  "The user aborted a request.",
  "Fetch is aborted",
  "success",
  "Policies Approved!",
  "firebase device token stored successfully",
  "Firebase settings retrieved successfully",
  "Languages retrieved successfully"
];
