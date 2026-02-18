// "use client";
// import React, { useState } from "react";
// import { usePhoneAuth } from "../../hooks/usePhoneAuth";

// export default function SignInScreen() {
//   const {
//     step,
//     loading,
//     error,
//     phoneNumber,
//     sendOtp,
//     verifyOtp,
//     resetAuth,
//     setError,
//   } = usePhoneAuth();

//   const [phone, setPhone] = useState("");
//   const [otp, setOtp] = useState("");
//   const [success, setSuccess] = useState(false);

//   const handlePhoneSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     const result = await sendOtp(phone);
//     if (!result) {
//       // Error already set by hook
//       return;
//     }
//   };

//   const handleOtpSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     const result = await verifyOtp(otp);
//     if (result) {
//       setSuccess(true);
//     }
//   };

//   const handleResendOtp = async () => {
//     setOtp("");
//     setError(null);
//     await sendOtp(phoneNumber);
//   };

//   const handleChangeNumber = () => {
//     setPhone("");
//     setOtp("");
//     resetAuth();
//   };

//   if (success) {
//     return (
//       <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
//         <div className="w-full max-w-sm p-8 bg-white rounded-lg shadow-lg text-center">
//           <div className="mb-4">
//             <svg
//               className="w-16 h-16 mx-auto text-green-600"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
//               />
//             </svg>
//           </div>
//           <h2 className="text-2xl font-bold text-gray-800 mb-2">
//             Sign In Successful!
//           </h2>
//           <p className="text-gray-600">Welcome back!</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
//       <div className="w-full max-w-sm p-8 bg-white rounded-lg shadow-lg">
//         <h2 className="mb-6 text-2xl font-bold text-center text-gray-800">
//           Sign In with Phone
//         </h2>

//         {error && (
//           <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
//             <p className="text-sm text-red-600 text-center">{error}</p>
//           </div>
//         )}

//         {step === "phone" && (
//           <form onSubmit={handlePhoneSubmit}>
//             <div className="mb-4">
//               <label className="block mb-2 text-sm font-medium text-gray-700">
//                 Phone Number
//               </label>
//               <input
//                 type="tel"
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-100 disabled:cursor-not-allowed"
//                 placeholder="+94771234567"
//                 value={phone}
//                 onChange={(e) => {
//                   setPhone(e.target.value);
//                   setError(null);
//                 }}
//                 disabled={loading}
//                 required
//                 autoComplete="tel"
//                 maxLength={12}
//               />
//               <p className="mt-1 text-xs text-gray-500">
//                 Format: +94XXXXXXXXX (Sri Lanka)
//               </p>
//             </div>

//             <button
//               type="submit"
//               className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
//               disabled={loading || phone.length < 12}
//             >
//               {loading ? (
//                 <span className="flex items-center justify-center">
//                   <svg
//                     className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
//                     xmlns="http://www.w3.org/2000/svg"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                   >
//                     <circle
//                       className="opacity-25"
//                       cx="12"
//                       cy="12"
//                       r="10"
//                       stroke="currentColor"
//                       strokeWidth="4"
//                     ></circle>
//                     <path
//                       className="opacity-75"
//                       fill="currentColor"
//                       d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                     ></path>
//                   </svg>
//                   Sending OTP...
//                 </span>
//               ) : (
//                 "Send OTP"
//               )}
//             </button>
//           </form>
//         )}

//         {step === "otp" && (
//           <div>
//             <form onSubmit={handleOtpSubmit}>
//               <div className="mb-4">
//                 <label className="block mb-2 text-sm font-medium text-gray-700">
//                   Enter OTP
//                 </label>
//                 <input
//                   type="text"
//                   inputMode="numeric"
//                   pattern="[0-9]*"
//                   className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition disabled:bg-gray-100 disabled:cursor-not-allowed"
//                   placeholder="000000"
//                   value={otp}
//                   onChange={(e) => {
//                     const value = e.target.value.replace(/\D/g, "");
//                     if (value.length <= 6) {
//                       setOtp(value);
//                       setError(null);
//                     }
//                   }}
//                   disabled={loading}
//                   required
//                   maxLength={6}
//                   autoComplete="one-time-code"
//                   autoFocus
//                 />
//                 <p className="mt-2 text-sm text-gray-600 text-center">
//                   Sent to {phoneNumber}
//                 </p>
//               </div>

//               <button
//                 type="submit"
//                 className="w-full py-3 px-4 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
//                 disabled={loading || otp.length !== 6}
//               >
//                 {loading ? (
//                   <span className="flex items-center justify-center">
//                     <svg
//                       className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
//                       xmlns="http://www.w3.org/2000/svg"
//                       fill="none"
//                       viewBox="0 0 24 24"
//                     >
//                       <circle
//                         className="opacity-25"
//                         cx="12"
//                         cy="12"
//                         r="10"
//                         stroke="currentColor"
//                         strokeWidth="4"
//                       ></circle>
//                       <path
//                         className="opacity-75"
//                         fill="currentColor"
//                         d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                       ></path>
//                     </svg>
//                     Verifying...
//                   </span>
//                 ) : (
//                   "Verify OTP"
//                 )}
//               </button>
//             </form>

//             <div className="mt-4 space-y-2">
//               <button
//                 type="button"
//                 onClick={handleResendOtp}
//                 className="w-full py-2 px-4 text-sm text-blue-600 hover:text-blue-700 font-medium transition disabled:opacity-50"
//                 disabled={loading}
//               >
//                 Resend OTP
//               </button>
//               <button
//                 type="button"
//                 onClick={handleChangeNumber}
//                 className="w-full py-2 px-4 text-sm text-gray-600 hover:text-gray-700 font-medium transition disabled:opacity-50"
//                 disabled={loading}
//               >
//                 Change Phone Number
//               </button>
//             </div>
//           </div>
//         )}

//         {/* reCAPTCHA container removed: handled by sendOTP */}
//       </div>
//     </div>
//   );
// }
