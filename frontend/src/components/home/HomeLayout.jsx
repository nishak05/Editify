import {FiUser, FiHome,  FiFolder, } from "react-icons/fi";

export default function HomeLayout({ children, onLibrary, currentPage = "home" , onAccount,onHelp,}) {

  return (
    <div className="flex h-screen bg-[#060B16] text-white">

      {/* LEFT SIDEBAR */}
      <aside className="w-64 bg-[#08111F] border-r border-white/10 flex flex-col">

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

        <div className="px-3 flex flex-col gap-2">

          <button
            className="
              w-full
              flex
              items-center
              gap-3
              px-5
              py-3.5
              rounded-xl
              bg-gradient-to-r
              from-cyan-500/15
              to-blue-600/15
              border
              border-cyan-500/40
              text-white
              font-medium
            "
          >
            <span className="text-lg"><FiHome /></span>
            Home
          </button>

          <button
            onClick={onLibrary}
            className="
              w-full
              flex
              items-center
              gap-3
              px-5
              py-3.5
              rounded-xl
              text-gray-400
              hover:bg-white/5
              hover:text-white
              transition
            "
          >
            <span className="text-lg">< FiFolder /></span>
            Library
          </button>

        </div>

        <div className="flex-1" />

        {/* Profile */}
        <div className="border-t border-white/10 p-6">

          <button
            onClick={onAccount}
            className="
              flex
              items-center
              gap-3
              text-gray-300
              hover:text-white
              transition
            "
          >
            <div
              className="
                w-12
                h-12
                rounded-full
                bg-gradient-to-r
                from-cyan-500
                to-purple-600
                flex
                items-center
                justify-center
              "
            >
              <FiUser size={22} />
            </div>

            <div className="text-left">
              <div className="font-medium">
                Profile
              </div>

              <div className="text-sm text-gray-500">
                My Account
              </div>
            </div>

          </button>

        </div>

      </aside>

      {/* RIGHT SIDE */}
      <div className="flex-1 flex flex-col">

        {/* TOP BAR */}
        <header
          className="
            h-14
            border-b
            border-white/10
            bg-[#08111F]/90
            backdrop-blur-md
            flex
            items-center
            justify-end
            px-8
          "
        >

          <button
            onClick={onHelp}
            className="
              text-gray-400
              hover:text-cyan-400
              transition
              font-medium
            "
          >
            Help
          </button>

        </header>


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