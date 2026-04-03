import { useState, useEffect, useCallback } from "react";
import axiosClient from "../api/axios";

const useFetch = (url, { enabled = true, fallback = null } = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!url || !enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get(url);
      setData(res.data);
    } catch (err) {
      setError(err.displayMessage || "Failed to load");
      if (fallback !== null) {
        setData(fallback);
      }
    } finally {
      setLoading(false);
    }
  }, [url, enabled, fallback]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

export default useFetch;
