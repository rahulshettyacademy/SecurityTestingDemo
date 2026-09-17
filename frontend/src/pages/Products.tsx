import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { Product } from "../api/types";

export function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("name") ?? "");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const name = searchParams.get("name");
    setLoading(true);
    const endpoint = name ? `/products/search?name=${encodeURIComponent(name)}` : "/products";
    api
      .get<Product[]>(endpoint)
      .then(setProducts)
      .finally(() => setLoading(false));
  }, [searchParams]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query) {
      setSearchParams({ name: query });
    } else {
      setSearchParams({});
    }
  }

  return (
    <div>
      <h1>Products</h1>
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder="Search products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>
      {loading ? (
        <p>Loading products...</p>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <Link to={`/products/${product.id}`} key={product.id} className="product-card">
              {product.image_url && <img src={product.image_url} alt={product.name} className="product-image" />}
              <h3>{product.name}</h3>
              <p className="category">{product.category}</p>
              <p className="price">₹{Number(product.price).toLocaleString("en-IN")}</p>
              <p className="stock">{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</p>
            </Link>
          ))}
          {products.length === 0 && <p>No products found.</p>}
        </div>
      )}
    </div>
  );
}
