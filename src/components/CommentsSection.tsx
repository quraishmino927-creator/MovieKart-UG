import React, { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, adminDb, auth, adminAuth } from '../lib/firebase';
import { useMovieContext } from '../context/MovieContext';
import { MovieComment } from '../types';
import { MessageSquare, Send, Trash2, Loader2, LogIn } from 'lucide-react';

interface CommentsSectionProps {
  mediaId: string;
  mediaType: 'movie' | 'tvshow';
  ownerMeta?: {
    createdBy?: string;
    createdByEmail?: string;
  };
  onRequireLogin: () => void;
}

function formatRelativeTime(timestampMs: number): string {
  if (!timestampMs || Number.isNaN(timestampMs)) return 'Just now';
  const diffSec = Math.max(0, Math.floor((Date.now() - timestampMs) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} ${diffMin === 1 ? 'min' : 'mins'} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} ${diffHr === 1 ? 'hour' : 'hours'} ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 30) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
  return new Date(timestampMs).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function parseCreatedAtMs(raw: unknown): number {
  if (typeof raw === 'number' && raw > 0) return raw;
  if (raw && typeof raw === 'object' && 'toMillis' in raw && typeof (raw as { toMillis: unknown }).toMillis === 'function') {
    return (raw as { toMillis: () => number }).toMillis();
  }
  return Date.now();
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  mediaId,
  mediaType,
  ownerMeta,
  onRequireLogin,
}) => {
  const {
    currentUser,
    isAdminAuthenticated,
    adminRole,
    isOwnedByCurrentStaff,
    showToast,
  } = useMovieContext();

  const [comments, setComments] = useState<MovieComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const commentsQuery = query(
      collection(db, 'comments'),
      where('mediaId', '==', mediaId)
    );

    const unsubscribe = onSnapshot(
      commentsQuery,
      (snapshot) => {
        const list: MovieComment[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Record<string, unknown>;
          return {
            id: docSnap.id,
            mediaId: typeof data.mediaId === 'string' ? data.mediaId : mediaId,
            mediaType: data.mediaType === 'tvshow' ? 'tvshow' : 'movie',
            userId: typeof data.userId === 'string' ? data.userId : '',
            userName: typeof data.userName === 'string' && data.userName.trim() ? data.userName : 'Viewer',
            userAvatar: typeof data.userAvatar === 'string' && data.userAvatar.trim() ? data.userAvatar : '/pwa-192x192.png',
            text: typeof data.text === 'string' ? data.text : '',
            createdAt: parseCreatedAtMs(data.createdAt ?? data.serverCreatedAt),
          };
        });
        list.sort((a, b) => b.createdAt - a.createdAt);
        setComments(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Comments listener error:', err);
        setComments([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [mediaId]);

  const canStaffModerate =
    isAdminAuthenticated &&
    (adminRole === 'Admin' ||
      (adminRole === 'Poster' && Boolean(ownerMeta && isOwnedByCurrentStaff(ownerMeta))));

  const canDeleteComment = (comment: MovieComment): boolean => {
    if (canStaffModerate) return true;
    const activeViewerId = auth.currentUser?.uid || currentUser?.id;
    return Boolean(activeViewerId && comment.userId && comment.userId === activeViewerId);
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireLogin();
      return;
    }
    const cleanText = commentText.trim();
    if (!cleanText) return;

    setSubmitting(true);
    try {
      const activeUserId = auth.currentUser?.uid || currentUser.id;
      await addDoc(collection(db, 'comments'), {
        mediaId,
        mediaType,
        userId: activeUserId,
        userName: currentUser.name || currentUser.username || 'Viewer',
        userAvatar: currentUser.avatar || '/pwa-192x192.png',
        text: cleanText,
        createdAt: Date.now(),
        serverCreatedAt: serverTimestamp(),
      });
      setCommentText('');
      showToast('Comment posted!');
    } catch (err) {
      console.error('Failed to post comment:', err);
      showToast('Could not post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setDeletingId(commentId);
    try {
      const targetDb = canStaffModerate && adminAuth.currentUser ? adminDb : db;
      await deleteDoc(doc(targetDb, 'comments', commentId));
      showToast('Comment deleted');
    } catch (err) {
      // Fallback to primary db if adminDb failed
      try {
        await deleteDoc(doc(db, 'comments', commentId));
        showToast('Comment deleted');
      } catch (fallbackErr) {
        console.error('Failed to delete comment:', err, fallbackErr);
        showToast('Could not delete comment.');
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="pt-5 border-t border-white/10 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm sm:text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#E50914]" />
          <span className="tabular-nums">Comments ({comments.length})</span>
        </h4>
        {canStaffModerate && (
          <span className="text-[11px] font-semibold text-amber-300">
            Moderation Active
          </span>
        )}
      </div>

      {/* Post Comment Input or Login CTA */}
      {currentUser ? (
        <form onSubmit={handlePostComment} className="flex items-start gap-2.5 sm:gap-3">
          <img
            src={currentUser.avatar || '/pwa-192x192.png'}
            alt={currentUser.name}
            className="w-9 h-9 rounded-full object-cover ring-2 ring-white/15 bg-black shrink-0 mt-0.5"
          />
          <div className="flex-1 min-w-0 space-y-2">
            <textarea
              rows={2}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment about this title..."
              maxLength={500}
              className="w-full bg-[#14141d] border border-white/10 focus:border-[#E50914] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none resize-none transition-colors"
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-gray-500 tabular-nums">
                {commentText.length}/500
              </span>
              <button
                type="submit"
                disabled={submitting || !commentText.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E50914] hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs transition-all cursor-pointer active:scale-95"
              >
                {submitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Post Comment</span>
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="p-4 rounded-2xl bg-[#14141d] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs sm:text-sm text-gray-300 text-center sm:text-left">
            Sign in to share your thoughts with other MovieKart UG viewers.
          </p>
          <button
            type="button"
            onClick={onRequireLogin}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E50914] hover:bg-red-700 text-white font-bold text-xs transition-all cursor-pointer shrink-0 active:scale-95"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Login to Comment</span>
          </button>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="py-6 flex items-center justify-center gap-2 text-xs text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin text-[#E50914]" />
          <span>Loading comments...</span>
        </div>
      ) : comments.length === 0 ? (
        <div className="p-5 rounded-2xl bg-[#14141d]/70 border border-white/5 text-center">
          <p className="text-xs sm:text-sm text-gray-400">
            No comments yet - be the first to comment
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
          {comments.map((c) => {
            const deletable = canDeleteComment(c);
            return (
              <div
                key={c.id}
                className="p-3.5 rounded-2xl bg-[#14141d] border border-white/5 flex items-start gap-3"
              >
                <img
                  src={c.userAvatar || '/pwa-192x192.png'}
                  alt={c.userName}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/pwa-192x192.png';
                  }}
                  className="w-9 h-9 rounded-full object-cover bg-black ring-1 ring-white/15 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
                      <span className="text-xs sm:text-sm font-bold text-white truncate">
                        {c.userName}
                      </span>
                      <span className="text-[11px] text-gray-400 whitespace-nowrap">
                        {formatRelativeTime(c.createdAt)}
                      </span>
                    </div>
                    {deletable && (
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(c.id)}
                        disabled={deletingId === c.id}
                        title="Delete comment"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-red-600/20 text-gray-400 hover:text-red-400 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                      >
                        {deletingId === c.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-200 leading-relaxed mt-1 break-words whitespace-pre-wrap">
                    {c.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
