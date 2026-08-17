import React, { createContext, useState, useContext } from 'react';

export const PostCreationContext = createContext();

export function PostCreationProvider({ children }) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editPostData, setEditPostData] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const openCreatePostModal = (post = null) => {
    setEditPostData(post);
    setIsCreateModalOpen(true);
  };

  const closeCreatePostModal = () => {
    setIsCreateModalOpen(false);
    setEditPostData(null);
  };

  const triggerRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <PostCreationContext.Provider 
      value={{ 
        isCreateModalOpen, 
        openCreatePostModal, 
        closeCreatePostModal,
        editPostData,
        refreshKey,
        triggerRefresh
      }}
    >
      {children}
    </PostCreationContext.Provider>
  );
}

export const usePostCreation = () => useContext(PostCreationContext);
