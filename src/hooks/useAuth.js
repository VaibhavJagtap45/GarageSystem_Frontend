import { useSelector, useDispatch } from "react-redux";

export default function useAuth() {
  const dispatch = useDispatch();
  const { user, garage, accessToken, loading, isAuthenticated } = useSelector(
    (state) => state.auth
  );
  return { user, garage, accessToken, loading, isAuthenticated, dispatch };
}

