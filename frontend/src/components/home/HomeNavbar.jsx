import { FiBookOpen, FiUser } from "react-icons/fi";

export default function HomeNavbar({ onHistory }) {
  return (
    <header className="absolute top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">

        <span
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
        </span>

        <div className="flex items-center gap-3">

          <button
            onClick={onHistory}
            className="
              flex items-center gap-2
              px-4 py-2.5
              rounded-xl
              text-sm font-medium
              text-gray-300
              hover:text-white
              hover:bg-white/5
              transition-all duration-200
            "
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
              text-gray-300
              hover:text-white
              hover:bg-white/5
              transition-all duration-200
            "
          >
            <FiUser size={16} />
            Profile
          </button>

        </div>

      </div>
    </header>
  );
}