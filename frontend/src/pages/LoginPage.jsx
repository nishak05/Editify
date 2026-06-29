import { FcGoogle } from "react-icons/fc";

export default function LoginPage() {
  return (
    <div
      className="min-h-screen bg-slate-900 bg-cover bg-center flex items-center justify-center relative"
      style={{
        background:
          "linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.65)), linear-gradient(135deg,#111827,#1e293b,#0f172a)"
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/30"></div>

      {/* Login Card */}
      <div className="relative z-10 w-[380px] rounded-3xl bg-[#1f1f26]/90 backdrop-blur-xl border border-gray-700 shadow-2xl px-8 py-8">

        {/* Logo */}
        <h1
          className="text-3xl text-white text-center font-bold tracking-wide mb-8"
          style={{ fontFamily: "Georgia" }}
        >
          Editify
        </h1>

        <h2 className="text-2xl font-bold text-white mb-2">
          Welcome Back
        </h2>

        <p className="text-gray-400 mb-6">
          Continue editing your creative projects.
        </p>

        {/* Google Button */}
        <button
          className="w-full h-12 rounded-xl bg-white hover:bg-gray-100 transition flex items-center justify-center gap-3 font-semibold text-gray-800"
        >
          <FcGoogle size={24} />
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center my-8">
          <div className="flex-1 h-px bg-gray-700"></div>
          <span className="mx-4 text-gray-500 text-sm">OR</span>
          <div className="flex-1 h-px bg-gray-700"></div>
        </div>

        {/* Email */}
        <input
          type="email"
          placeholder="Email Address"
          className="w-full h-12 rounded-xl bg-[#2b2b36] border border-gray-700 outline-none px-4 text-white placeholder-gray-500 focus:border-blue-500 mb-5"
        />

        <button
          className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 transition text-white font-semibold"
        >
          Continue
        </button>

        {/* Footer */}
        <p className="text-center text-gray-400 text-sm mt-8">
          Don't have an account?{" "}
          <button className="text-blue-400 hover:text-blue-300">
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
}