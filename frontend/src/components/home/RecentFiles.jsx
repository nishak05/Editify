export default function RecentFiles() {

  const files = [
    {
      name: "lemon_tea.png",
      size: "2.1 MB • PNG",
      time: "2 hours ago",
      image: "https://picsum.photos/80?1"
    },
    {
      name: "coffee_shop.jpg",
      size: "3.4 MB • JPG",
      time: "Yesterday",
      image: "https://picsum.photos/80?2"
    },
    {
      name: "music_fest.png",
      size: "1.8 MB • PNG",
      time: "2 days ago",
      image: "https://picsum.photos/80?3"
    },
    {
      name: "summer_sale.jpg",
      size: "2.9 MB • JPG",
      time: "4 days ago",
      image: "https://picsum.photos/80?4"
    },
  ]

  return (

    <div className="mt-8">

      <div className="flex items-center justify-between px-2 mb-4">

        <h2 className="text-2xl font-semibold">
          Recent Files
        </h2>

        <button className="text-cyan-400 hover:text-cyan-300">
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

            <img
              src={file.image}
              className="w-20 h-20 rounded-lg object-cover"
            />

            <div className="flex-1 overflow-hidden">

              <p className="truncate font-medium">
                {file.name}
              </p>

              <p className="text-sm text-gray-400">
                {file.size}
              </p>

              <p className="text-sm text-gray-500">
                {file.time}
              </p>

            </div>

            <button className="text-gray-500 hover:text-white text-xl">
              ⋮
            </button>

            </div>

          ))}

        </div>

      </div>

    </div>

  )

}