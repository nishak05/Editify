import { FiUpload, FiBookOpen, FiUser } from "react-icons/fi";

export default function HistoryNavbar({
    currentPage,
    goToUpload,
    goToHistory,
}) {

    return (
        <nav className="flex items-center justify-between px-8 py-4 bg-[#0B1120] border-b border-white/10">

            <span
              className="
                text-3xl
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
          </span>

          <div className="flex items-center gap-2">

              <button
                  onClick={goToUpload}
                  className={`
                      flex items-center gap-2
                      px-4 py-2.5
                      rounded-xl
                      text-sm font-medium
                      transition-all duration-200
                      ${
                          currentPage === "upload"
                              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-500/20"
                              : "text-gray-400 hover:text-white hover:bg-white/5"
                      }
                  `}
              >
                  <FiUpload size={16} />
                  Upload
              </button>

              <button
                  onClick={goToHistory}
                  className={`
                      flex items-center gap-2
                      px-4 py-2.5
                      rounded-xl
                      text-sm font-medium
                      transition-all duration-200
                      ${
                          currentPage === "history"
                              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-500/20"
                              : "text-gray-400 hover:text-white hover:bg-white/5"
                      }
                  `}
              >
                  <FiBookOpen size={16} />
                  Library
              </button>

              <button
                  className="
                      flex items-center gap-2
                      px-4 py-2.5
                      rounded-xl
                      text-sm font-medium
                      text-gray-400
                      hover:text-white
                      hover:bg-white/5
                      transition-all duration-200
                  "
              >
                  <FiUser size={16} />
                  Profile
              </button>

          </div>

        </nav>
    )
}