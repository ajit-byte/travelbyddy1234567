import { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getNotifications, acceptNotification as apiAccept, declineNotification as apiDecline, markNotificationRead as apiRead } from '../api/socialApi.js';

/**
 * Manages notification fetching and actions (accept/decline/read).
 * Automatically clears the red dot when the user visits /notifications.
 * Re-fetches when the logged-in user changes.
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const markedReadRef = useRef(false);

  const refetch = useCallback(async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  // Re-fetch whenever the logged-in user changes (account switch)
  useEffect(() => {
    if (user && localStorage.getItem('authTokens')) {
      setNotifications([]); // clear stale data from previous account
      setLoading(true);
      markedReadRef.current = false;
      refetch();
    } else {
      setNotifications([]);
      setLoading(false);
    }
  }, [user?.id, refetch]); // user?.id changes on account switch

  // When user navigates to /notifications, mark all non-pending as read
  // and immediately zero out the dot in local state
  useEffect(() => {
    if (location.pathname !== '/notifications') {
      markedReadRef.current = false; // reset so next visit triggers again
      return;
    }
    if (markedReadRef.current) return;
    markedReadRef.current = true;

    const token = JSON.parse(localStorage.getItem('authTokens'))?.token;
    if (!token) return;

    // Optimistically clear unread informational notifications in local state
    setNotifications(prev =>
      prev.map(n =>
        n.status !== 'pending' ? { ...n, status: 'read' } : n
      )
    );

    // Persist to backend
    fetch(`${import.meta.env.VITE_API_URL}/api/social/notifications/read-all`, {
      method: 'POST',
      headers: { 'x-auth-token': token },
    }).catch(err => console.error('read-all failed:', err));
  }, [location.pathname]);

  const accept = async (id) => {
    await apiAccept(id);
    refetch();
  };

  const decline = async (id) => {
    await apiDecline(id);
    refetch();
  };

  const markRead = async (id) => {
    await apiRead(id);
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, status: 'read' } : n));
  };

  // Red dot: pending requests + unread informational notifications
  const unreadCount = notifications.filter(n =>
    n.status === 'pending' ||
    (n.status !== 'read' && !['follow_request', 'trip_join_request'].includes(n.type))
  ).length;

  return { notifications, loading, accept, decline, markRead, unreadCount, refetch };
}
