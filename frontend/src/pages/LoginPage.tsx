import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import {
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  MessageSquare,
  Sparkles,
  User,
  CheckCircle2,
} from "lucide-react";
import { useAppData, user_service } from "../context/AppContext";
import Loading from "../components/Loading";

const LoginPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const navigate = useNavigate();
  const { isAuth, loading: userLoading, fetchUser } = useAppData();

  if (userLoading) return <Loading />;
  if (isAuth) return <Navigate to="/chat" replace />;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanName = name.trim();

    // Basic validation
    if (!cleanEmail || !cleanPassword) {
      setErrorMessage("Please enter both email and password.");
      toast.error("Please fill in all required fields");
      return;
    }

    if (isSignUp && !cleanName) {
      setErrorMessage("Please enter your name.");
      toast.error("Please enter your name");
      return;
    }

    if (cleanPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isSignUp
        ? `${user_service}/api/v1/register`
        : `${user_service}/api/v1/login`;

      const payload = isSignUp
        ? { name: cleanName, email: cleanEmail, password: cleanPassword }
        : { email: cleanEmail, password: cleanPassword };

      const { data } = await axios.post(endpoint, payload);

      if (data.token) {
        // Save token in cookie (15 days expiry)
        Cookies.set("token", data.token, { expires: 15 });
        toast.success(data.message || (isSignUp ? "Account created!" : "Welcome back!"));
        await fetchUser();
        navigate("/chat", { replace: true });
      } else {
        toast.error("Authentication failed. Please try again.");
      }
    } catch (error: any) {
      const serverMsg =
        error?.response?.data?.message ||
        "Authentication failed. Please check your credentials.";
      setErrorMessage(serverMsg);
      toast.error(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F9] flex items-center justify-center p-4">
      <div className="max-w-md w-full animate-fade-in">
        <div className="bg-white rounded-[32px] p-8 sm:p-10 border border-slate-200/80 shadow-xl shadow-slate-200/60 transition-all">
          {/* Brand Header */}
          <div className="text-center mb-6">
            <div className="relative inline-block mb-3">
              <div className="w-16 h-16 rounded-[22px] bg-gradient-to-tr from-[#544CE6] via-[#635BFF] to-[#8C82FC] flex items-center justify-center text-white shadow-lg shadow-[#544CE6]/30">
                <MessageSquare className="w-8 h-8 fill-white/20" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white shadow-xs flex items-center justify-center text-[#544CE6]">
                <Sparkles className="w-3 h-3 fill-[#544CE6]" />
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center gap-1.5">
              <span>Halista</span>
              <span className="text-[#544CE6]">Chat</span>
            </h1>

            <p className="text-slate-400 text-xs sm:text-sm font-medium mt-1">
              {isSignUp
                ? "Create an account to start messaging"
                : "Sign in with your email and password"}
            </p>
          </div>

          {/* Mode Switch Tabs */}
          <div className="flex bg-[#F3F4F9] p-1 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setErrorMessage("");
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                !isSignUp
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setErrorMessage("");
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                isSignUp
                  ? "bg-white text-[#544CE6] shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Input (Sign Up only) */}
            {isSignUp && (
              <div className="animate-fade-in">
                <label
                  htmlFor="name"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
                >
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required={isSignUp}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F4F5FB] border border-transparent focus:border-[#544CE6]/40 focus:bg-white text-slate-900 text-sm font-medium transition-all focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F4F5FB] border border-transparent focus:border-[#544CE6]/40 focus:bg-white text-slate-900 text-sm font-medium transition-all focus:outline-none"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-600"
                >
                  Password
                </label>
                <span className="text-[11px] text-slate-400">min 6 chars</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  className="w-full pl-10 pr-11 py-3 rounded-2xl bg-[#F4F5FB] border border-transparent focus:border-[#544CE6]/40 focus:bg-white text-slate-900 text-sm font-medium transition-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message Feedback */}
            {errorMessage && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-fade-in flex items-center justify-between">
                <span>{errorMessage}</span>
                {errorMessage.toLowerCase().includes("user does not exist") && !isSignUp && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(true);
                      setErrorMessage("");
                    }}
                    className="ml-2 underline font-bold text-[#544CE6] hover:text-[#433BCE] cursor-pointer whitespace-nowrap"
                  >
                    Sign Up now
                  </button>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-6 rounded-2xl font-bold bg-[#544CE6] hover:bg-[#433BCE] text-white transition-all shadow-md shadow-[#544CE6]/20 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{isSignUp ? "Signing Up..." : "Signing In..."}</span>
                </>
              ) : (
                <>
                  <span>{isSignUp ? "Sign Up" : "Sign In"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick CV Feature Highlight Footer */}
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-medium text-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Full CRUD • Socket.IO Real-time • JWT Auth</span>
            </div>
            <p className="text-[11px] text-center text-slate-400">
              {isSignUp ? (
                <span>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(false);
                      setErrorMessage("");
                    }}
                    className="text-[#544CE6] font-bold hover:underline cursor-pointer"
                  >
                    Sign In
                  </button>
                </span>
              ) : (
                <span>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(true);
                      setErrorMessage("");
                    }}
                    className="text-[#544CE6] font-bold hover:underline cursor-pointer"
                  >
                    Sign Up
                  </button>
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
