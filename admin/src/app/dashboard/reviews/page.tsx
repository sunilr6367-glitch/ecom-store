'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Loader2, Star, Check, X, Trash2, Filter } from 'lucide-react';

interface Review {
  id: string;
  title?: string | null;
  content: string;
  product_id: string;
  rating: number;
  author_name: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected' | string;
  verified_purchase?: boolean;
  images?: string[];
}

interface ReviewsResponse {
  reviews?: Review[];
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const data = (await api.getReviews(50, 0, statusFilter)) as ReviewsResponse;
      setReviews(data.reviews || []);
    } catch (error) {
      console.error('Failed to fetch reviews', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void fetchReviews();
  }, [fetchReviews]);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await api.updateReviewStatus(id, newStatus);
      setReviews(
        reviews.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
    } catch {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      await api.deleteReview(id);
      setReviews(reviews.filter((r) => r.id !== id));
    } catch (error) {
      console.error(error);
      alert('Failed to delete review');
    }
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-gray-400" size={24} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Reviews</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and moderate customer reviews
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-gray-200 text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-black"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Product / Review</th>
                <th className="px-6 py-4">Rating</th>
                <th className="px-6 py-4">Author</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reviews.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-400 italic"
                  >
                    No reviews found matching filters.
                  </td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 max-w-sm">
                      <div className="font-medium text-gray-900 mb-1">
                        {review.title || 'No Title'}
                      </div>
                      <p className="text-gray-500 line-clamp-2 text-xs leading-relaxed">
                        {review.content}
                      </p>
                      <div className="text-[10px] text-gray-400 mt-1 font-mono">
                        {review.product_id}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex text-yellow-500">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            fill={i < review.rating ? 'currentColor' : 'none'}
                            className={i < review.rating ? '' : 'text-gray-200'}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {review.author_name}
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Date(review.created_at).toLocaleDateString()}
                      </div>
                      {review.verified_purchase ? (
                        <div className="mt-1 text-xs font-semibold text-green-700">Verified purchase</div>
                      ) : null}
                      {review.images?.length ? (
                        <div className="mt-1 text-xs text-gray-400">{review.images.length} image(s)</div>
                      ) : null}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize
                                                ${
                                                  review.status === 'approved'
                                                    ? 'bg-green-50 text-green-700 border border-green-100'
                                                    : review.status ===
                                                        'rejected'
                                                      ? 'bg-red-50 text-red-700 border border-red-100'
                                                      : 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                                                }`}
                      >
                        {review.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {review.status !== 'approved' && (
                          <button
                            onClick={() =>
                              handleStatusUpdate(review.id, 'approved')
                            }
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Approve"
                          >
                            <Check size={16} />
                          </button>
                        )}
                        {review.status !== 'rejected' && (
                          <button
                            onClick={() =>
                              handleStatusUpdate(review.id, 'rejected')
                            }
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Reject"
                          >
                            <X size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(review.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded transition-colors ml-2"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
