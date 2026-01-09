import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../utils/axiosInstance';
import { useAuthStore } from '../store/authStore';
import React from 'react';

// fetch user data from API
const fetchUser = async () => {
  const response = await axiosInstance.get('/api/logged-in-user');
  return response.data.user;
};

const useUser = () => {
  const { setLoggedIn } = useAuthStore();

  const {
    data: user,
    isPending,
    isError,
  } = useQuery({
    queryKey: ['user'],
    queryFn: fetchUser,
    staleTime: 1000 * 60 * 5,
    retry: false,
    // Always try to fetch user - if cookie exists, it will succeed
    // If no cookie, it will fail gracefully
  });

  // Update auth state based on query results
  React.useEffect(() => {
    if (user) {
      setLoggedIn(true);
    } else if (isError) {
      setLoggedIn(false);
    }
  }, [user, isError, setLoggedIn]);

  return { user: user as any, isLoading: isPending, isError };
};

export default useUser;
