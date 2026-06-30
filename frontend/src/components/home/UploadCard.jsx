import { FiUploadCloud } from "react-icons/fi";

export default function UploadCard({
  isDragging,
  isLoading,
  error,
  step,
  fileInputRef,
  handleFile,
  onDrop,
  setIsDragging,
}) {
  return (
    <div className="w-full max-w-3xl">

      {!isLoading ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={`
            rounded-[30px]
            p-[2px]
            transition-all
            duration-300
            ${
              isDragging
                ? "bg-gradient-to-r from-cyan-400 to-purple-500"
                : "bg-gradient-to-r from-cyan-500/50 to-purple-500/50"
            }
          `}
        >

          {/* Outer Border */}

          <div className="rounded-[28px] bg-[#0E1420] p-3">

            {/* Inner Dashed Box */}

            <div
              className="
                rounded-[24px]
                border-2
                border-dashed
                border-white/10
                flex
                flex-col
                items-center
                justify-center
                text-center
                px-8
                py-5
              "
            >

              {/* Upload Icon */}

              <div className="w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <FiUploadCloud
                  size={28}
                  className="text-cyan-400"
                />
              </div>

              <h2 className="mt-4 text-2xl font-medium text-white">
                Drag & drop your image here
              </h2>

              <p className="mt-2 text-lg text-gray-400">
                or{" "}
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="text-cyan-400 hover:text-cyan-300"
                >
                click to browse
                </button>
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleFile(e.target.files[0])}
              />

              <p className="mt-4 text-sm text-gray-500">
                Supports: PNG, JPG, JPEG • Max size: 20MB
              </p>

              <button
                onClick={() => fileInputRef.current.click()}
                className="
                  mt-5
                  px-8
                  py-2.5
                  rounded-xl
                  text-lg
                  font-medium
                  bg-gradient-to-r
                  from-blue-500
                  to-purple-600
                  hover:from-blue-400
                  hover:to-purple-500
                  transition
                "
              >
                Choose File
              </button>

              <button
                className="
                  mt-4
                  text-base
                  text-gray-400
                  hover:text-white
                "
              >
                No image? Try a{" "}
                <span className="text-cyan-400">
                  sample
                </span>
              </button>

            </div>

          </div>

        </div>

      ) : (

        <div className="rounded-[28px] bg-[#101826] border border-cyan-500/30 py-12 text-center">

          <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />

          <p className="mt-4 text-xl text-cyan-300">
            {step}
          </p>

          <p className="mt-2 text-gray-500">
            This usually takes 10–20 seconds
          </p>

        </div>

      )}

      {error && (
        <div className="mt-4 rounded-xl bg-red-900/30 border border-red-600 px-5 py-3 text-red-300">
          {error}
        </div>
      )}

    </div>
  );
}