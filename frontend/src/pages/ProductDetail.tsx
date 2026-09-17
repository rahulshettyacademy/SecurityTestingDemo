import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApiError, api } from "../api/client";
import { Product, Review } from "../api/types";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  function loadReviews() {
    api.get<Review[]>(`/products/${id}/reviews`).then(setReviews);
  }

  useEffect(() => {
    api.get<Product>(`/products/${id}`).then(setProduct);
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function handleAddToCart() {
    if (product) {
      addItem(product, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    }
  }

  async function handleReviewSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post(`/products/${id}/reviews`, { rating, comment });
      setComment("");
      setRating(5);
      loadReviews();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to submit review");
    }
  }

  if (!product) {
    return <p>Loading...</p>;
  }

  return (
    <div className="product-detail">
      <button className="link-button" onClick={() => navigate(-1)}>
        &larr; Back
      </button>
      {product.image_url && <img src={product.image_url} alt={product.name} className="product-image-large" />}
      <h1>{product.name}</h1>
      <p className="category">{product.category}</p>
      <p>{product.description}</p>
      <p className="price">₹{Number(product.price).toLocaleString("en-IN")}</p>
      <p className="stock">{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</p>
      <button onClick={handleAddToCart} disabled={product.stock === 0}>
        {added ? "Added!" : "Add to cart"}
      </button>

      <section className="reviews">
        <h2>Reviews</h2>
        {reviews.length === 0 && <p>No reviews yet.</p>}
        <ul>
          {reviews.map((review) => (
            <li key={review.id}>
              <strong>{review.author}</strong> — {review.rating}/5
              <p dangerouslySetInnerHTML={{ __html: review.comment }} />
            </li>
          ))}
        </ul>

        {user ? (
          <form onSubmit={handleReviewSubmit} className="form">
            <label>
              Rating
              <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Comment
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} required />
            </label>
            {error && <p className="error-text">{error}</p>}
            <button type="submit">Submit review</button>
          </form>
        ) : (
          <p>Login to write a review.</p>
        )}
      </section>
    </div>
  );
}
