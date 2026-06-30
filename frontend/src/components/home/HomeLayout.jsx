import { FiBookOpen, FiUser } from "react-icons/fi";

export default function HomeLayout({ children, onLibrary }) {
  return (
    <div className="flex h-screen bg-[#060B16] text-white">

      {/* LEFT SIDEBAR */}
      <aside className="w-64 bg-[#08111F] border-r border-white/10 flex flex-col">

        {/* Logo */}
        <div className="px-8 pt-8 pb-10">
          <h1
            className="
              text-4xl
              font-extrabold
              tracking-tight
              bg-gradient-to-r
              from-cyan-400
              via-blue-500
              to-purple-500
              bg-clip-text
              text-transparent
            "
          >
            Editify
          </h1>
        </div>

        {/* Navigation */}
        <div className="px-3">

          <button
            onClick={onLibrary}
            className="
              w-full
              flex
              items-center
              gap-3
              px-5
              py-4
              rounded-xl
              border
              border-blue-500
              bg-white/5
              text-white
              transition
            "
          >
            <FiBookOpen size={20} />
            <span className="text-lg font-medium">
              Library
            </span>
          </button>

        </div>

        <div className="flex-1" />

        {/* Profile */}
        <div className="border-t border-white/10 p-6">

          <button
            className="
              flex
              items-center
              gap-3
              text-gray-300
              hover:text-white
              transition
            "
          >
            <div className="
                w-12
                h-12
                rounded-full
                bg-gradient-to-r
                from-cyan-500
                to-purple-600
                flex
                items-center
                justify-center
            ">
              <FiUser size={22} />
            </div>

            <div className="text-left">
              <div className="font-medium">
                Profile
              </div>

              <div className="text-sm text-gray-500">
                View Profile →
              </div>
            </div>
          </button>

        </div>

      </aside>

      {/* RIGHT SIDE */}
      <div className="flex-1 flex flex-col">

        {/* TOP BAR */}
        <header className="h-14 border-b border-white/10 bg-[#08111F]/90 backdrop-blur-md" />

        {/* PAGE CONTENT */}
        <main
          className="flex-1 overflow-auto bg-[#070C18]"
          style={{
            backgroundImage: `
              radial-gradient(circle at top center, rgba(59,130,246,0.12), transparent 35%),
              radial-gradient(circle at right 20%, rgba(168,85,247,0.08), transparent 28%),
              radial-gradient(circle at left 35%, rgba(34,211,238,0.05), transparent 25%)
            `,
          }}
        >
          {children}
        </main>

      </div>

    </div>
  );
}