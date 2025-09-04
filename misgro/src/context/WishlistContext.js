"use client";
import React, { createContext, useState, useContext, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import API from "../services/api";

export const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [wishlistItems, setWishlistItems] = useState([]);

  useEffect(() => {
    if (user) {
      fetchWishlistFromDB(user.id);
    } else {
      setWishlistItems([]);
    }
  }, [user]);

  const fetchWishlistFromDB = async (userId) => {
    try {
      const res = await API.get(`/wishlist?userId=${userId}`);
      setWishlistItems(res.data);
    } catch (error) {
      console.error("Error al cargar wishlist:", error);
    }
  };

  const addToWishlist = async (product) => {
    if (!user) {
        // El UI debe prevenir que se llame a esta función si no hay usuario.
        return;
    }
    try {
      await API.post(`/wishlist?userId=${user.id}&productId=${product.id}`);
      await fetchWishlistFromDB(user.id);
    } catch (error) {
      // El interceptor maneja el 401.
      console.error("Error al agregar a wishlist:", error);
    }
  };

  const removeFromWishlist = async (id) => {
    if (!user) return;
    try {
      await API.delete(`/wishlist?userId=${user.id}&productId=${id}`);
      setWishlistItems((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error al eliminar de wishlist:", error);
    }
  };

  const clearWishlist = () => {
    setWishlistItems([]);
  };

  return (
    <WishlistContext.Provider
      value={{ wishlistItems, addToWishlist, removeFromWishlist, clearWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
};
