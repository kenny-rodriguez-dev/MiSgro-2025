"use client";
import React, { createContext, useState, useContext, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import API from "../services/api";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    if (user) {
      fetchCartFromDB(user.id);
    } else {
      setCartItems([]);
    }
  }, [user]);

  const fetchCartFromDB = async (userId) => {
    try {
      const res = await API.get(`/cart?userId=${userId}`);
      const mapped = res.data.map((p) => ({
        id: p.productId,
        name: p.name,
        price: p.price,
        imageUrl: p.imageUrl,
        stock: p.stock,
        discountPercent: p.discountPercent,
        isDiscountActive: p.isDiscountActive,
        quantity: p.quantity,
      }));
      setCartItems(mapped);
    } catch (error) {
      console.error("Error al cargar carrito:", error);
    }
  };

  const addToCart = async (product, quantity = 1) => {
    if (!user) {
        // La lógica del interceptor y el modal global se encargará si hay token expirado.
        // Si no hay usuario en absoluto, no hacemos nada silenciosamente.
        // El UI debe prevenir que se llame a esta función si no hay usuario.
        return;
    }
    try {
      await API.post(`/cart?userId=${user.id}&productId=${product.id}&qty=${quantity}`);
      await fetchCartFromDB(user.id);
    } catch (error) {
      // El interceptor maneja el 401. Para otros errores, se loguea en la consola.
      console.error("Error al agregar al carrito:", error);
    }
  };

  const updateCartQuantity = async (id, newQuantity) => {
    if (!user) return;
    try {
      // Esta lógica podría ser un endpoint PUT/PATCH en el futuro para más eficiencia.
      await API.delete(`/cart?userId=${user.id}&productId=${id}`);
      await API.post(`/cart?userId=${user.id}&productId=${id}&qty=${newQuantity}`);
      await fetchCartFromDB(user.id);
    } catch (error) {
      console.error("Error al actualizar cantidad:", error);
    }
  };

  const removeFromCart = async (id) => {
    if (!user) return;
    try {
      await API.delete(`/cart?userId=${user.id}&productId=${id}`);
      setCartItems((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error al eliminar del carrito:", error);
    }
  };

  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        fetchCartFromDB,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
