"use client";
import { useState, useEffect, useContext, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import API from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import { CartContext } from "../../context/CartContext";
import { WishlistContext } from "../../context/WishlistContext";
import { useTheme } from "../theme-provider";

// Se importa directamente de MUI como en la página de referencia
import { Breadcrumbs, Link as MUILink, Typography } from "@mui/material";

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const term = searchParams.get("term") || "";
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noResults, setNoResults] = useState(false);
  const [globalDiscountPercent, setGlobalDiscountPercent] = useState(0);
  const { user } = useContext(AuthContext);
  const { cartItems, addToCart } = useContext(CartContext);
  const { wishlistItems, addToWishlist } = useContext(WishlistContext);
  const [disabledSet, setDisabledSet] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // --- Hook para el modo oscuro ---
  const { darkMode } = useTheme();

  // --- Lógica de paginación y colores ---
  const articlesContainerRef = useRef(null);
  const milagroGreen = "#009246";
  const milagroRed = "#ED1C24";

  const smoothScrollToTop = () => {
    if (articlesContainerRef.current) {
      articlesContainerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const handlePageClick = (pageNumber) => {
    const totalPages = Math.ceil(products.length / itemsPerPage);
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      setTimeout(smoothScrollToTop, 0);
    }
  };

  const getPaginationNumbers = () => {
    const totalPages = Math.ceil(products.length / itemsPerPage);
    const pages = [];
    if (totalPages <= 3) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 2) {
        pages.push(1, 2, 3);
      } else if (currentPage >= totalPages - 1) {
        pages.push(totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(currentPage - 1, currentPage, currentPage + 1);
      }
    }
    return pages;
  };

  useEffect(() => {
    loadCategories();
    fetchGlobalDiscount();
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset page on new search/filter
    fetchData();
  }, [term, selectedCategory]);

  // Effect for pagination changes
  useEffect(() => {
    fetchData();
  }, [currentPage]);

  async function loadCategories() {
    try {
      const res = await API.get("/categories");
      setCategories(res.data);
    } catch (error) {
      console.error("Error al cargar categorías:", error);
    }
  }

  async function fetchGlobalDiscount() {
    try {
      const res = await API.get("/settings");
      setGlobalDiscountPercent(res.data.globalDiscountPercent || 0);
    } catch (error) {
      // omit
    }
  }

  async function fetchData() {
    setLoading(true);
    setNoResults(false);
    try {
      let results = [];
      if (term.trim()) {
        const searchRes = await API.get(
          `/products/search?term=${encodeURIComponent(term)}`
        );
        results = searchRes.data;
      } else {
        const allRes = await API.get("/products");
        results = allRes.data;
      }
      if (selectedCategory !== "all") {
        const catRes = await API.get(`/categories/${selectedCategory}/products`);
        const catData = catRes.data;
        const catIdsSet = new Set(catData.map((p) => p.id));
        results = results.filter((p) => catIdsSet.has(p.id));
      }
      if (results.length === 0) {
        setNoResults(true);
      }
      setProducts(results);
    } catch (error) {
      console.error("Error al filtrar productos:", error);
      setProducts([]);
      setNoResults(true);
    }
    setLoading(false);
  }

  function handleCategoryChange(e) {
    setSelectedCategory(e.target.value);
  }

  function isInCart(id) {
    return cartItems.some((item) => item.id === id);
  }

  function isInWishlist(id) {
    return wishlistItems.some((item) => item.id === id);
  }

  function handleAddToCart(product) {
    if (!user) {
      alert("Debes iniciar sesión para agregar al carrito.");
      return;
    }
    if (disabledSet.has(product.id)) return;
    addToCart(product, 1);
    const newSet = new Set(disabledSet);
    newSet.add(product.id);
    setDisabledSet(newSet);
  }

  const totalItems = products.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedProducts = products.slice(startIndex, endIndex);
  const corePageNumbers = getPaginationNumbers();
  const firstCorePageNumber = corePageNumbers.length > 0 ? corePageNumbers[0] : 0;
  const lastCorePageNumber =
    corePageNumbers.length > 0
      ? corePageNumbers[corePageNumbers.length - 1]
      : 0;
  const showFirstPageButton = totalPages > 3 && firstCorePageNumber > 1;
  const showStartEllipsis = totalPages > 3 && firstCorePageNumber > 2;
  const showEndEllipsis = totalPages > 3 && lastCorePageNumber < totalPages - 1;
  const showLastPageButton = totalPages > 3 && lastCorePageNumber < totalPages;

  if (loading) {
    return <p className="text-center mt-8">Cargando productos...</p>;
  }

  return (
    <section ref={articlesContainerRef} className="container mx-auto p-4">
      {/* Componente Breadcrumbs de MUI implementado directamente */}
      <Breadcrumbs aria-label="breadcrumb" className="mb-4" sx={{ color: darkMode ? 'white' : 'inherit' }}>
        <MUILink component={Link} href="/" underline="hover" color="inherit">
            Inicio
        </MUILink>
        <Typography color="inherit" fontWeight="bold">
            Productos
        </Typography>
      </Breadcrumbs>

      <h1 className="text-3xl font-bold mb-6">Catálogo de Productos</h1>
      <div className="flex items-center gap-2 mb-6">
        <label className="font-semibold" htmlFor="categorySelect">
          Filtrar por categoría:
        </label>
        <select
          id="categorySelect"
          value={selectedCategory}
          onChange={handleCategoryChange}
          className={`border p-2 rounded cursor-pointer ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
        >
          <option value="all">Todas</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {!noResults && term.trim() && (
        <p className="mb-4">
          Resultados para "<strong>{term}</strong>"
        </p>
      )}

      {noResults && (
        <p className="text-red-500 mb-4">
          No se han encontrado resultados para "<strong>{term}</strong>"
          {selectedCategory !== "all" && " en esta categoría"}
        </p>
      )}
      
      {/* --- Contenedor de productos responsivo --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {displayedProducts.map((product) => {
          let finalPrice = product.price;
          let hasDiscount = false;
          let discountLabel = "";
          if (globalDiscountPercent > 0) {
            finalPrice -= finalPrice * (globalDiscountPercent / 100);
            hasDiscount = true;
            discountLabel = `-${globalDiscountPercent}% (Global)`;
          } else if (product.isDiscountActive && product.discountPercent > 0) {
            finalPrice -= finalPrice * (product.discountPercent / 100);
            hasDiscount = true;
            discountLabel = `-${product.discountPercent}%`;
          }
          if (finalPrice < 0) finalPrice = 0;

          const inCart = isInCart(product.id);
          const inWish = isInWishlist(product.id);
          const outOfStock = product.stock <= 0;
          const isBtnDisabled = disabledSet.has(product.id) || inCart || outOfStock;
          const baseUrl = "http://localhost:5009";
          const imageUrl = product.imageUrl?.startsWith("http")
            ? product.imageUrl
            : product.imageUrl
            ? baseUrl + product.imageUrl
            : "/no-image.png";

          return (
            // --- Tarjeta de producto responsiva ---
            <div
              key={product.id}
              className={`group border rounded-lg shadow-md flex flex-col md:flex-col overflow-hidden transition-shadow hover:shadow-xl ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}
            >
              {/* Contenedor principal que cambia de dirección */}
              <div className="flex flex-row md:flex-col">
                {/* --- Contenedor de la Imagen --- */}
                <div className="relative w-2/5 md:w-full flex-shrink-0 md:h-64 md:p-4">
                  <Link href={`/products/${product.id}`} className="block w-full h-full">
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="w-full h-full object-contain transform transition duration-300 md:group-hover:scale-105"
                    />
                  </Link>
                  {hasDiscount && (
                    <span className="absolute top-2 left-2 md:top-6 md:left-6 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                      {discountLabel}
                    </span>
                  )}
                </div>

                {/* --- Contenedor del Contenido (solo en móvil) --- */}
                <div className="flex-1 flex flex-col p-3 justify-between md:hidden">
                  <div>
                    <Link href={`/products/${product.id}`}>
                      <h3
                        className={`font-bold text-base mb-1 break-words transition-colors ${darkMode ? 'text-white hover:text-red-400' : `text-[#009246] hover:text-[#ED1C24]`}`}
                      >
                        {product.name}
                      </h3>
                    </Link>
                    {product.shortDescription && (
                        <div
                            className={`text-xs mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                            dangerouslySetInnerHTML={{ __html: product.shortDescription }}
                        />
                    )}
                    {hasDiscount ? (
                      <div className="mb-2">
                        <span className={`text-xs line-through mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          ${product.price.toFixed(2)}
                        </span>
                        <span className={`text-base font-semibold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                          ${finalPrice.toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <p className={`font-semibold text-base mb-2 ${darkMode ? 'text-white' : ''}`}>
                        ${product.price.toFixed(2)}
                      </p>
                    )}
                    <p className={`text-xs mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Stock: {product.stock}</p>
                  </div>
                  <div className="flex flex-col gap-2 mt-auto">
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={isBtnDisabled}
                      className={`w-full text-center px-2 py-1 rounded transition-colors duration-200 text-xs font-semibold ${
                        isBtnDisabled
                          ? "bg-gray-400 text-white cursor-not-allowed"
                          : `bg-[#009246] text-white hover:bg-[#ED1C24] cursor-pointer`
                      }`}
                    >
                      {outOfStock ? "Sin stock" : inCart ? "En Carrito" : "Agregar"}
                    </button>
                    <button
                      onClick={() => {
                        if (!user) { alert("Debes iniciar sesión para añadir a Favoritos."); return; }
                        if (!inWish) { addToWishlist(product); }
                      }}
                      disabled={inWish}
                      className={`w-full text-center px-2 py-1 rounded transition-colors duration-200 text-xs font-semibold ${
                        inWish
                          ? "bg-gray-400 text-white cursor-not-allowed"
                          : `bg-[#ED1C24] text-white hover:bg-red-700 cursor-pointer`
                      }`}
                    >
                      {inWish ? "En Wishlist" : "Favorito"}
                    </button>
                  </div>
                </div>
              </div>
              {/* --- Contenido para Escritorio --- */}
              <div className="p-4 hidden md:flex md:flex-col md:flex-grow">
                <Link href={`/products/${product.id}`}>
                  <h3
                    className={`font-bold text-xl mb-1 break-words line-clamp-2 transition-colors ${darkMode ? 'text-white hover:text-red-400' : `text-[#009246] hover:text-[#ED1C24]`}`}
                  >
                    {product.name}
                  </h3>
                </Link>
                {product.shortDescription && (
                    <div
                        className={`text-sm flex-grow line-clamp-3 mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                        dangerouslySetInnerHTML={{ __html: product.shortDescription }}
                    />
                )}
                {hasDiscount ? (
                  <div className="mb-2">
                    <span className={`text-sm line-through mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      ${product.price.toFixed(2)}
                    </span>
                    <span className={`text-lg font-semibold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                      ${finalPrice.toFixed(2)}
                    </span>
                  </div>
                ) : (
                  <p className={`font-semibold text-lg mb-2 ${darkMode ? 'text-white' : ''}`}>
                    ${product.price.toFixed(2)}
                  </p>
                )}
                <p className={`text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Stock: {product.stock}</p>
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={isBtnDisabled}
                    className={`w-full text-center px-3 py-1 rounded transition-colors duration-200 text-sm font-semibold ${
                      isBtnDisabled
                        ? "bg-gray-400 text-white cursor-not-allowed"
                        : `bg-[#009246] text-white hover:bg-[#ED1C24] cursor-pointer`
                    }`}
                  >
                    {outOfStock ? "Sin stock" : inCart ? "En Carrito" : "Agregar"}
                  </button>
                  <button
                    onClick={() => {
                      if (!user) { alert("Debes iniciar sesión para añadir a Favoritos."); return; }
                      if (!inWish) { addToWishlist(product); }
                    }}
                    disabled={inWish}
                    className={`w-full text-center px-3 py-1 rounded transition-colors duration-200 text-sm font-semibold ${
                      inWish
                        ? "bg-gray-400 text-white cursor-not-allowed"
                        : `bg-[#ED1C24] text-white hover:bg-red-700 cursor-pointer`
                    }`}
                  >
                    {inWish ? "En Wishlist" : "Favorito"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* --- Paginación Nueva --- */}
      {totalPages > 0 && (
        <div className="flex justify-center items-center space-x-1 sm:space-x-2 mt-8">
          <button
            onClick={() => handlePageClick(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-2 sm:px-4 rounded-md transition-colors duration-300 font-semibold text-sm ${
              currentPage === 1
                ? `bg-gray-300 text-gray-500 opacity-50 cursor-not-allowed`
                : `${darkMode ? 'bg-gray-700 text-white hover:bg-red-500' : 'bg-gray-200 text-black hover:bg-[#ED1C24] hover:text-white'} cursor-pointer`
            }`}
          >
            « Anterior
          </button>
          {showFirstPageButton && (
            <button
              key="page-1"
              onClick={() => handlePageClick(1)}
              className={`px-3 py-2 sm:px-4 rounded-md transition-colors duration-300 font-semibold text-sm cursor-pointer ${
                currentPage === 1
                  ? `bg-[#009246] text-white shadow-md`
                  : `${darkMode ? 'bg-gray-700 text-white hover:bg-red-500' : 'bg-gray-200 text-black hover:bg-[#ED1C24] hover:text-white'}`
              }`}
            >
              1
            </button>
          )}
          {showStartEllipsis && (
            <span className={`px-1 sm:px-2 py-1`}>...</span>
          )}
          {corePageNumbers.map((page) => (
            <button
              key={`page-${page}`}
              onClick={() => handlePageClick(page)}
              className={`px-3 py-2 sm:px-4 rounded-md transition-colors duration-300 font-semibold text-sm cursor-pointer ${
                currentPage === page
                  ? `bg-[#009246] text-white shadow-md`
                  : `${darkMode ? 'bg-gray-700 text-white hover:bg-red-500' : 'bg-gray-200 text-black hover:bg-[#ED1C24] hover:text-white'}`
              }`}
            >
              {page}
            </button>
          ))}
          {showEndEllipsis && (
            <span className={`px-1 sm:px-2 py-1`}>...</span>
          )}
          {showLastPageButton && (
            <button
              key={`page-${totalPages}`}
              onClick={() => handlePageClick(totalPages)}
              className={`px-3 py-2 sm:px-4 rounded-md transition-colors duration-300 font-semibold text-sm cursor-pointer ${
                currentPage === totalPages
                  ? `bg-[#009246] text-white shadow-md`
                  : `${darkMode ? 'bg-gray-700 text-white hover:bg-red-500' : 'bg-gray-200 text-black hover:bg-[#ED1C24] hover:text-white'}`
              }`}
            >
              {totalPages}
            </button>
          )}
          <button
            onClick={() => handlePageClick(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-2 sm:px-4 rounded-md transition-colors duration-300 font-semibold text-sm ${
              currentPage === totalPages
                ? `bg-gray-300 text-gray-500 opacity-50 cursor-not-allowed`
                : `${darkMode ? 'bg-gray-700 text-white hover:bg-red-500' : 'bg-gray-200 text-black hover:bg-[#ED1C24] hover:text-white'} cursor-pointer`
            }`}
          >
            Siguiente »
          </button>
        </div>
      )}
    </section>
  );
}
