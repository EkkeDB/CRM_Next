export default function CSSTestPage() {
  return (
    <div className="p-8 bg-red-500">
      <h1 className="text-4xl font-bold text-white mb-4">CSS Test Page</h1>
      <div className="bg-blue-500 p-4 rounded-lg">
        <p className="text-white">If this has a blue background, Tailwind is working!</p>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="bg-green-500 h-20 rounded"></div>
        <div className="bg-yellow-500 h-20 rounded"></div>
        <div className="bg-purple-500 h-20 rounded"></div>
      </div>
      <button className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded">
        Test Button
      </button>
    </div>
  )
}