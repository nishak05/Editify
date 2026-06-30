export default function Hero() {
  return (
    <div className="pt-2 pb-2 flex flex-col items-center">

      <h1 className="text-7xl font-extrabold tracking-tight">
        <span
          className="
            inline-block
            pb-3
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
      </h1>

      <p className="mt-2 text-md text-gray-300">
        Your creative space.
        <span className="ml-3 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent font-semibold">
          Edit. Enhance. Elevate.
        </span>
      </p>

    </div>
  )
}