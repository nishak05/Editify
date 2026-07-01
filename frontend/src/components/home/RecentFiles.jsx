import { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export default function RecentFiles({ onOpen, onViewAll }) {

  const [files, setFiles] = useState([]);

  useEffect(() => {

      axios.get(`${API}/projects`)
          .then(res => {
              setFiles(res.data.slice(0, 4));
          })
          .catch(() => {});

  }, []);

  return (

    <div className="mt-8">

      <div className="flex items-center justify-between px-2 mb-4">

        <h2 className="text-2xl font-semibold">
          Recent Files
        </h2>

        <button
          onClick={onViewAll}
          className="text-cyan-400 hover:text-cyan-300"
        >
          View All
        </button>

      </div>

      <div className="
            rounded-2xl
            border
            border-white/10
            bg-white/5
            backdrop-blur-xl
            px-6
            py-4
            "
          >

        <div className="grid grid-cols-4 gap-5">

          {files.map((file,index)=>(

            <div
              key={index}
              onClick={() => onOpen(file)}

              className="
              flex
              items-center
              gap-4
              rounded-xl
              border
              border-white/10
              bg-[#0F1625]
              px-4
              py-4
              hover:border-cyan-500/40
              transition
              cursor-pointer
              "
            >

            {file.thumbnail_b64 ? (
              <img
                src={`data:image/png;base64,${file.thumbnail_b64}`}
                className="w-20 h-20 rounded-lg object-cover"
                alt={file.filename}
              />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-[#1B2434] flex items-center justify-center text-xs text-gray-500">
                No Preview
              </div>
            )}

            <div 
              className="flex-1 overflow-hidden">

              <p className="truncate font-medium">
                {file.filename}
              </p>

              <p className="text-sm text-gray-400">
                {new Date(file.created_at).toLocaleDateString()}
              </p>

            </div>

            </div>

          ))}

        </div>

      </div>

    </div>

  )

}