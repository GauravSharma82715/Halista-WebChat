import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import axios from "axios";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Camera,
  Edit3,
  Image as ImageIcon,
  Loader2,
  Mail,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";
import { useAppData, user_service, getToken, saveToken } from "../context/AppContext";
import Loading from "../components/Loading";

const ProfilePage = () => {
  const { user, isAuth, loading, setUser } = useAppData();

  const [isEdit, setIsEdit] = useState(false);
  const [name, setName] = useState<string>("");
  const [profilePic, setProfilePic] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setProfilePic(user.profilePic || "");
    }
  }, [user]);

  const editHandler = () => {
    setIsEdit(!isEdit);
    setName(user?.name || "");
    setProfilePic(user?.profilePic || "");
  };

  // Compress & resize gallery photo using client-side canvas
  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose a valid image file");
      return;
    }

    setProcessingImage(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Target max dimension for profile avatar
        const maxDim = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
          setProfilePic(compressedDataUrl);
          toast.success("Photo selected from gallery!");
        } else {
          // Fallback to original data URL if canvas fails
          setProfilePic(event.target?.result as string);
        }
        setProcessingImage(false);
      };

      img.onerror = () => {
        toast.error("Failed to load image");
        setProcessingImage(false);
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      toast.error("Failed to read image file");
      setProcessingImage(false);
    };

    reader.readAsDataURL(file);

    // Reset input value so user can re-pick the same file if desired
    e.target.value = "";
  };

  const submitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    setSubmitting(true);
    const token = getToken();
    try {
      const { data } = await axios.post(
        `${user_service}/api/v1/update/user`,
        { name, profilePic },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      saveToken(data.token);

      toast.success("Profile updated successfully!");
      setUser(data.user);
      setIsEdit(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update profile");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isAuth && !loading) {
      navigate("/login");
    }
  }, [isAuth, navigate, loading]);

  if (loading) return <Loading />;

  const initials = user?.name ? user.name.slice(0, 2).toUpperCase() : "U";

  return (
    <div className="min-h-screen bg-[#F3F4F9] p-4 sm:p-8 flex items-center justify-center">
      <div className="max-w-xl w-full animate-fade-in">
        {/* Top bar */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/chat")}
            className="p-2.5 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200/80 transition-colors shadow-xs text-slate-600 hover:text-slate-900 cursor-pointer"
            title="Back to Chat"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Profile Settings
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#EDEFFC] text-[#544CE6] text-[11px] font-bold">
                Halista Chat
              </span>
            </div>
            <p className="text-slate-400 text-xs font-medium mt-0.5">
              Manage your personal display name and gallery photo
            </p>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-[32px] border border-slate-200/80 shadow-xl shadow-slate-200/50 overflow-hidden p-6 sm:p-8">
          {/* Header Section with Profile Picture Preview */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-slate-100">
            {/* Avatar Preview with Camera overlay button */}
            <div className="relative group">
              {profilePic ? (
                <img
                  src={profilePic}
                  alt={user?.name || "Profile"}
                  className="w-24 h-24 rounded-[26px] object-cover shadow-xs border-2 border-[#544CE6]/20"
                />
              ) : (
                <div className="w-24 h-24 rounded-[26px] bg-[#EDEFFC] text-[#544CE6] flex items-center justify-center font-bold text-3xl shadow-xs">
                  {initials}
                </div>
              )}

              {/* Upload trigger overlay on avatar in edit mode */}
              {isEdit && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/45 rounded-[26px] flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs cursor-pointer"
                  title="Upload Photo from Gallery"
                >
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-bold">Upload</span>
                </button>
              )}

              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-3 border-white shadow-xs" />
            </div>

            {/* Hidden File Input for Gallery Selection */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleGalleryUpload}
              accept="image/*"
              className="hidden"
            />

            <div className="flex-1 text-center sm:text-left min-w-0">
              <h2 className="text-xl font-bold text-slate-900 truncate">
                {user?.name || "User"}
              </h2>
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-slate-400 text-xs mt-0.5 font-medium">
                <Mail size={13} className="text-slate-400" />
                <span className="truncate">{user?.email}</span>
              </div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold mt-2">
                <ShieldCheck size={13} />
                <span>Verified Account</span>
              </div>
            </div>
          </div>

          {/* Form & Gallery Upload Section */}
          <div className="pt-6 space-y-6">
            {isEdit ? (
              <form onSubmit={submitHandler} className="space-y-5">
                {/* Direct Gallery Upload Control */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Profile Photo
                    </label>
                    {profilePic && (
                      <button
                        type="button"
                        onClick={() => setProfilePic("")}
                        className="text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Photo</span>
                      </button>
                    )}
                  </div>

                  {/* Big Gallery Upload Button */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 hover:border-[#544CE6]/60 bg-[#F8F9FD] hover:bg-[#EEF1FA] rounded-2xl p-5 text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center gap-2 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white text-[#544CE6] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                      {processingImage ? (
                        <Loader2 className="w-6 h-6 animate-spin text-[#544CE6]" />
                      ) : (
                        <ImageIcon className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {processingImage
                          ? "Optimizing photo..."
                          : "Choose from Gallery / Photos"}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        JPEG, PNG, WEBP or GIF supported
                      </p>
                    </div>
                    <button
                      type="button"
                      className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 bg-[#EDEFFC] text-[#544CE6] rounded-xl text-xs font-bold group-hover:bg-[#544CE6] group-hover:text-white transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Browse Gallery</span>
                    </button>
                  </div>
                </div>

                {/* Display Name Input */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Display Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-[#F4F5FB] border border-transparent focus:border-[#544CE6]/40 focus:bg-white rounded-2xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#544CE6]/20 transition-all"
                      placeholder="Enter your name"
                      autoFocus
                      required
                    />
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-2.5 pt-2">
                  <button
                    type="submit"
                    disabled={submitting || processingImage}
                    className="flex items-center justify-center gap-1.5 px-6 py-3 bg-[#544CE6] hover:bg-[#433BCE] text-white font-bold rounded-2xl transition-all shadow-xs text-xs disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={editHandler}
                    disabled={submitting}
                    className="flex items-center justify-center gap-1.5 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all text-xs cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Display Name
                  </label>
                  <div className="flex items-center justify-between p-3.5 bg-[#F4F5FB] rounded-2xl">
                    <span className="text-slate-900 font-bold text-sm">
                      {user?.name || "Not set"}
                    </span>
                    <button
                      onClick={editHandler}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Edit Profile</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Email Address
                  </label>
                  <div className="flex items-center justify-between p-3.5 bg-[#F4F5FB] rounded-2xl text-xs">
                    <span className="font-mono text-slate-700 font-bold">
                      {user?.email}
                    </span>
                    <span className="text-[10px] text-slate-400 bg-white px-2 py-0.5 rounded-md font-bold">
                      Primary
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
