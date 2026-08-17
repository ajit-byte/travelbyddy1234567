import { useState, useEffect } from 'react';
import { getPosts, getLikeStatus, getSaveStatus, toggleLike as apiToggleLike, toggleSave as apiToggleSave, getComments as apiGetComments, addComment as apiAddComment, toggleCommentLike as apiToggleCommentLike, addReply as apiAddReply } from '../api/postsApi.js';

/**
 * Manages the post feed with like/save state, comments, and replies.
 */
export function usePosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likeState, setLikeState] = useState({});
  const [saveState, setSaveState] = useState({});
  const [comments, setComments] = useState({});
  const [openComments, setOpenComments] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getPosts();
        setPosts(data);
        // Load like + save state in parallel
        const [likeResults, saveResults] = await Promise.all([
          Promise.all(data.map(p => getLikeStatus(p._id).catch(() => null))),
          Promise.all(data.map(p => getSaveStatus(p._id).catch(() => null))),
        ]);
        const likeMap = {}, saveMap = {};
        data.forEach((p, i) => {
          if (likeResults[i]) likeMap[p._id] = likeResults[i];
          if (saveResults[i]) saveMap[p._id] = saveResults[i];
        });
        setLikeState(likeMap);
        setSaveState(saveMap);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleLike = async (postId) => {
    try {
      const data = await apiToggleLike(postId);
      setLikeState(prev => ({ ...prev, [postId]: data }));
    } catch (err) { console.error(err); }
  };

  const toggleSave = async (postId) => {
    try {
      const data = await apiToggleSave(postId);
      setSaveState(prev => ({ ...prev, [postId]: data }));
    } catch (err) { console.error(err); }
  };

  const openCommentsFor = async (postId) => {
    if (openComments === postId) { setOpenComments(null); return; }
    setOpenComments(postId);
    if (!comments[postId]) {
      try {
        const data = await apiGetComments(postId);
        setComments(prev => ({ ...prev, [postId]: data }));
      } catch (err) { console.error(err); }
    }
  };

  const addComment = async (postId, text) => {
    try {
      const newComment = await apiAddComment(postId, text);
      setComments(prev => ({ ...prev, [postId]: [newComment, ...(prev[postId] || [])] }));
    } catch (err) { console.error(err); }
  };

  const toggleCommentLike = async (postId, commentId) => {
    try {
      const data = await apiToggleCommentLike(postId, commentId);
      setComments(prev => ({
        ...prev,
        [postId]: (prev[postId] || []).map(c =>
          c._id === commentId ? { ...c, likes: Array(data.count).fill(null), _liked: data.liked } : c
        ),
      }));
    } catch (err) { console.error(err); }
  };

  const addReply = async (postId, commentId, text) => {
    try {
      const updated = await apiAddReply(postId, commentId, text);
      setComments(prev => ({
        ...prev,
        [postId]: (prev[postId] || []).map(c => c._id === commentId ? updated : c),
      }));
    } catch (err) { console.error(err); }
  };

  const addPost = (post) => setPosts(prev => [post, ...prev]);

  return { posts, loading, likeState, saveState, comments, openComments, toggleLike, toggleSave, openCommentsFor, addComment, toggleCommentLike, addReply, addPost };
}
