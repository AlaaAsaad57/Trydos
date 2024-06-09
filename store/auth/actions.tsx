export const ReInitialise = () => {
  console.log("RE-INITIALIZE");
  return { type: "RE-INITILIASE" };
};
export const lodaingOTP = (val) => {
  return { type: "LOADING-OTP", payload: val };
};
