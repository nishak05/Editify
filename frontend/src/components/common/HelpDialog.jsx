import { FiX, FiUploadCloud, FiEdit3, FiSave, FiLayers } from "react-icons/fi";

export default function HelpDialog({ open, onClose }) {

  if (!open) return null;

  return (

    <div
      className="
        fixed
        inset-0
        z-50
        bg-black/60
        backdrop-blur-sm
        flex
        items-center
        justify-center
      "
    >

      <div
        className="
          relative
          w-full
          max-w-5xl
          mx-6
          rounded-3xl
          border
          border-white/10
          bg-[#101826]
          shadow-2xl
          overflow-hidden
        "
      >

        {/* Header */}

        <div className="flex items-center justify-between px-8 py-6 border-b border-white/10">

          <div>

            <h2 className="text-3xl font-bold">
              Help
            </h2>

            <p className="text-gray-400 mt-1">
              Everything you need to get started with Editify.
            </p>

          </div>

          <button
            onClick={onClose}
            className="
              w-10
              h-10
              rounded-full
              hover:bg-white/10
              flex
              items-center
              justify-center
              transition
            "
          >
            <FiX size={22} />
          </button>

        </div>

        {/* Body */}

        <div className="px-8 py-8 space-y-8">

          {/* Welcome */}

          <div>

            <h3 className="text-xl font-semibold mb-3">
              Welcome
            </h3>

            <p className="text-gray-300 leading-8">
              Editify transforms posters, flyers, banners and logos into fully editable layered designs using AI.
            </p>

          </div>

          {/* Quick Start */}

          <div>

            <h3 className="text-xl font-semibold mb-5">
              Quick Start
            </h3>

            <div className="grid grid-cols-2 gap-5">

              <Step
                icon={<FiUploadCloud />}
                title="Upload"
                text="Choose any PNG, JPG or WEBP image."
              />

              <Step
                icon={<FiLayers />}
                title="AI Processing"
                text="Objects, text and layers are detected automatically."
              />

              <Step
                icon={<FiEdit3 />}
                title="Edit"
                text="Move, resize and edit every layer independently."
              />

              <Step
                icon={<FiSave />}
                title="Save"
                text="Save your work and reopen it anytime."
              />

            </div>

          </div>

          {/* Tips */}

          <div>

            <h3 className="text-xl font-semibold mb-3">
              Best Results
            </h3>

            <ul className="space-y-2 text-gray-300">

              <li>• Use high-resolution images.</li>

              <li>• Posters with clear text produce better OCR.</li>

              <li>• Avoid extremely blurred or noisy images.</li>

              <li>• Large solid backgrounds reconstruct best.</li>

            </ul>

          </div>

        </div>

      </div>

    </div>

  );

}

function Step({ icon, title, text }) {

  return (

    <div
      className="
        rounded-2xl
        border
        border-white/10
        bg-[#0F1625]
        p-5
      "
    >

      <div className="text-cyan-400 text-2xl mb-3">
        {icon}
      </div>

      <h4 className="font-semibold text-lg mb-2">
        {title}
      </h4>

      <p className="text-gray-400">
        {text}
      </p>

    </div>

  );

}