import Link from 'next/link';
import {
  Layers,
  Clapperboard,
  LayoutGrid,
  Images,
} from 'lucide-react';

export default function ContentDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Content Management</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/dashboard/content/category-circles"
          className="block p-6 bg-white rounded-xl border hover:border-blue-500 transition shadow-sm"
        >
          <LayoutGrid className="mb-4 text-violet-600" size={32} />
          <h2 className="text-xl font-bold mb-2">Category Circles</h2>
          <p className="text-gray-500">
            Manage the circular quick-link row shown under category banners.
          </p>
        </Link>
        <Link
          href="/dashboard/content/social-gallery"
          className="block p-6 bg-white rounded-xl border hover:border-blue-500 transition shadow-sm"
        >
          <Images className="mb-4 text-amber-600" size={32} />
          <h2 className="text-xl font-bold mb-2">Social Gallery</h2>
          <p className="text-gray-500">
            Curate the real images and destinations used in Follow Our Journey.
          </p>
        </Link>
        <Link
          href="/dashboard/content/trending-reels"
          className="block p-6 bg-white rounded-xl border hover:border-blue-500 transition shadow-sm"
        >
          <Clapperboard className="mb-4 text-rose-600" size={32} />
          <h2 className="text-xl font-bold mb-2">Trending Reels</h2>
          <p className="text-gray-500">
            Manage vertical video cards shown below the hero banner.
          </p>
        </Link>
        <Link
          href="/dashboard/content/reel-collections"
          className="block p-6 bg-white rounded-xl border hover:border-blue-500 transition shadow-sm"
        >
          <Layers className="mb-4 text-indigo-600" size={32} />
          <h2 className="text-xl font-bold mb-2">Reel Collections</h2>
          <p className="text-gray-500">
            Manage reels page hero carousel slides and collection filters.
          </p>
        </Link>
      </div>
    </div>
  );
}
