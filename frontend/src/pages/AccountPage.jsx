import { useState } from "react";

export default function AccountPage({ onBack }) {

  const [tab, setTab] = useState("profile");

  return (
    <div className="min-h-screen bg-[#070B16] text-white">

      <div className="max-w-7xl mx-auto px-8 py-8">

        <h1 className="text-4xl font-bold mb-8">
          My Account
        </h1>

        <div className="grid grid-cols-[260px_1fr] gap-8">

          {/* LEFT */}

          <div className="
            rounded-2xl
            border
            border-white/10
            bg-[#101826]
            p-4
            h-fit
          ">

            <button
              onClick={() => setTab("profile")}
              className={`
                w-full
                text-left
                px-4
                py-3
                rounded-xl
                mb-2
                transition
                ${tab === "profile"
                  ? "bg-cyan-500/15 border border-cyan-500/40"
                  : "hover:bg-white/5"}
              `}
            >
              Profile
            </button>

            <button
              onClick={() => setTab("about")}
              className={`
                w-full
                text-left
                px-4
                py-3
                rounded-xl
                mb-2
                transition
                ${tab === "about"
                  ? "bg-cyan-500/15 border border-cyan-500/40"
                  : "hover:bg-white/5"}
              `}
            >
              About Editify
            </button>

            <div className="mt-10 pt-5 border-t border-white/10">

              <p className="text-gray-500 text-sm">
                Version
              </p>

              <p className="font-medium">
                v1.0.0
              </p>

            </div>

            <button
              onClick={onBack}
              className="
                mt-8
                text-cyan-400
                hover:text-cyan-300
              "
            >
              ← Back to Home
            </button>

          </div>

          {/* RIGHT */}

          <div className="
            rounded-2xl
            border
            border-white/10
            bg-[#101826]
            p-8
          ">

            {tab === "profile" && (

              <>
                <h2 className="text-3xl font-semibold mb-8">
                  Profile
                </h2>

                <div className="space-y-6">

                  <InfoRow label="Name" value="Nisha Kumari" />
                  <InfoRow label="Email" value="Coming Soon" />
                  <InfoRow label="Account Type" value="Local" />
                  <InfoRow label="Projects" value="--" />
                  <InfoRow label="Joined" value="July 2026" />

                </div>
              </>

            )}

            {tab === "about" && (

              <>
                <h2 className="text-3xl font-semibold mb-6">
                  About Editify
                </h2>

                <p className="text-gray-300 leading-8">

                  Editify is an AI-powered design editor that converts posters,
                  flyers and banners into fully editable layered designs.

                </p>

                <div className="mt-8">

                  <h3 className="font-semibold mb-4">
                    Built With
                  </h3>

                  <div className="flex flex-wrap gap-3">

                    {[
                      "React",
                      "FastAPI",
                      "OpenCV",
                      "GroundingDINO",
                      "SAM2",
                      "PaddleOCR",
                      "LaMa",
                    ].map(item => (

                      <div
                        key={item}
                        className="
                          px-4
                          py-2
                          rounded-full
                          bg-cyan-500/10
                          border
                          border-cyan-500/30
                        "
                      >
                        {item}
                      </div>

                    ))}

                  </div>

                </div>

              </>

            )}

          </div>

        </div>

      </div>

    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="
      flex
      justify-between
      items-center
      border-b
      border-white/10
      pb-4
    ">
      <span className="text-gray-400">
        {label}
      </span>

      <span className="font-medium">
        {value}
      </span>
    </div>
  );
}