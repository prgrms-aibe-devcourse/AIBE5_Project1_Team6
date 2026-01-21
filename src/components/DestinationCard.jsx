import "../styles/cards.css";

export default function DestinationCard({
  image,
  title,
  subtitle,
  priceText,
  ratingText,
  badgeLeftTop,   // 예: "SAFE" / "RISK"
  badgeColor,     // "green" | "red" | "gray"
  bottomLeftTag,  // 예: "₩1,340 = $1" 같은 환율표시
}) {
  return (
    <article className="card">
      <div className="thumb">
        <img src={image} alt={title} />

        {badgeLeftTop && (
          <div className={`badge ${badgeColor || "gray"}`}>
            {badgeLeftTop}
          </div>
        )}

        {bottomLeftTag && (
          <div className="bottomTag">
            {bottomLeftTag}
          </div>
        )}
      </div>

      <div className="cardBody">
        <div className="cardTitleRow">
          <h3 className="cardTitle">{title}</h3>
          {ratingText && <div className="rating">{ratingText}</div>}
        </div>
        {subtitle && <p className="cardSub">{subtitle}</p>}
        {priceText && <p className="price">{priceText}</p>}
      </div>
    </article>
  );
}
