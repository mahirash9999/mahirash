import React, { useState, useEffect } from 'react';
import { db } from '../../../components/Firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import uploadToCloudinary from '../../../utils/cloudinary';
import { User, Mail, Phone, ShieldCheck, Camera, Save, CheckCircle2 } from 'lucide-react';
import OptimizedCloudinaryImage from '../../../components/OptimizedCloudinaryImage';

const AdminProfileSettings = () => {
  const [profile, setProfile] = useState({
    name: "Mahirash Admin",
    role: "CHIEF EXECUTIVE ADMINISTRATOR",
    email: "mahirash.help@gmail.com",
    phone: "+91 8959041514",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
    bio: "Chief Executive Officer & Administrator of Mahirash Luxury Perfume Operations."
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const cached = localStorage.getItem("mahirash_admin_profile");
        if (cached) {
          setProfile(JSON.parse(cached));
        }
        const snap = await getDoc(doc(db, 'admin_profile', 'main'));
        if (snap.exists()) {
          const data = snap.data();
          setProfile(data);
          localStorage.setItem("mahirash_admin_profile", JSON.stringify(data));
        }
      } catch (err) {
        console.error("Error loading admin profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file, "logo");
      setProfile(prev => ({ ...prev, image: url }));
    } catch (err) {
      alert("Image upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      await setDoc(doc(db, 'admin_profile', 'main'), profile);
      localStorage.setItem("mahirash_admin_profile", JSON.stringify(profile));
      window.dispatchEvent(new Event("adminProfileUpdated"));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert("Error saving profile: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-[#30231F] font-['Inter',sans-serif] max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#E9DCCB] shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#30231F] uppercase tracking-wider flex items-center gap-2">
            <User className="text-[#800020]" size={22} /> Administrator Profile Settings
          </h2>
          <p className="text-[14px] text-[#75665D] mt-1">Manage your administrative name, profile photo, credentials, and bio details.</p>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-[14px] text-[#75665D]">Loading administrator profile...</div>
      ) : (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E9DCCB] shadow-sm space-y-6">

            {/* Profile Avatar Upload */}
            <div className="flex flex-col sm:flex-row items-center gap-6 border-b border-[#E9DCCB]/60 pb-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#800020]/30 shadow-md bg-[#FCF9F4]">
                  <OptimizedCloudinaryImage src={profile.image} alt={profile.name} preset="avatar" className="w-full h-full object-cover" />
                </div>
                <label className="absolute inset-0 bg-[#800020]/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[14px] gap-1">
                  <Camera size={16} />
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              </div>
              <div className="text-center sm:text-left space-y-1">
                <h3 className="text-base font-bold text-[#30231F]">{profile.name}</h3>
                <p className="text-[12px] font-bold text-[#800020] uppercase tracking-widest">{profile.role}</p>
                <div className="pt-1">
                  <label className="inline-block px-4 py-1.5 bg-[#FCF9F4] hover:bg-[#E9DCCB]/50 text-[#30231F] text-[13px] font-semibold rounded-xl cursor-pointer transition-colors border border-[#E9DCCB]">
                    {uploading ? "Uploading Photo..." : "Change Profile Photo"}
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
              </div>
            </div>

            {/* Profile Input Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[14px]">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#75665D] uppercase tracking-wider block">Administrator Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full px-4 py-3 bg-[#FCF9F4] border border-[#E9DCCB] rounded-xl text-[#30231F] font-semibold outline-none focus:border-[#800020] focus:ring-1 focus:ring-[#800020]/20 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#75665D] uppercase tracking-wider block">Role / Title</label>
                <input
                  type="text"
                  value={profile.role}
                  onChange={(e) => setProfile(prev => ({ ...prev, role: e.target.value }))}
                  required
                  className="w-full px-4 py-3 bg-[#FCF9F4] border border-[#E9DCCB] rounded-xl text-[#30231F] font-semibold outline-none focus:border-[#800020] focus:ring-1 focus:ring-[#800020]/20 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#75665D] uppercase tracking-wider block">Email Address / Admin ID</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                  required
                  className="w-full px-4 py-3 bg-[#FCF9F4] border border-[#E9DCCB] rounded-xl text-[#30231F] font-semibold outline-none focus:border-[#800020] focus:ring-1 focus:ring-[#800020]/20 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#75665D] uppercase tracking-wider block">Phone Number</label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#FCF9F4] border border-[#E9DCCB] rounded-xl text-[#30231F] font-semibold outline-none focus:border-[#800020] focus:ring-1 focus:ring-[#800020]/20 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[11px] font-bold text-[#75665D] uppercase tracking-wider block">Bio / Information</label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 bg-[#FCF9F4] border border-[#E9DCCB] rounded-xl text-[#30231F] font-medium outline-none focus:border-[#800020] focus:ring-1 focus:ring-[#800020]/20 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between pt-4 border-t border-[#E9DCCB]/60">
              {savedSuccess ? (
                <div className="flex items-center gap-2 text-[#800020] text-[14px] font-semibold animate-pulse">
                  <CheckCircle2 size={16} /> Profile Saved Successfully!
                </div>
              ) : <div />}

              <button
                type="submit"
                disabled={saving || uploading}
                className="px-6 py-3.5 bg-[#800020] hover:bg-[#650018] text-white font-bold text-[13px] uppercase tracking-wider rounded-xl shadow-md shadow-[#800020]/25 transition-all flex items-center gap-2 cursor-pointer ml-auto"
              >
                <Save size={15} />
                <span>{saving ? "Saving Profile..." : "Save Profile Changes"}</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminProfileSettings;
