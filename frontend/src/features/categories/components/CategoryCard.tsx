import { Button } from "../../../components/ui/Button";

import type { Category } from "../types";

type CategoryCardProps = {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
};

export function CategoryCard({
  category,
  onEdit,
  onDelete,
}: CategoryCardProps) {
  const headingId = `category-${category.id}-name`;
  const typeClass =
    category.type === "INCOME"
      ? "category-badge category-badge--income"
      : "category-badge category-badge--expense";

  return (
    <article
      className={`category-card category-card--${category.type.toLowerCase()}`}
      aria-labelledby={headingId}
    >
      <div className="category-card-header">
        <h2 id={headingId} className="category-card-name">
          {category.name}
        </h2>
      </div>

      <dl className="category-card-meta">
        <div>
          <dt>Type</dt>
          <dd>
            <span className={typeClass}>{category.type}</span>
          </dd>
        </div>
      </dl>

      <div className="category-card-actions">
        <Button
          variant="secondary"
          onClick={() => onEdit(category)}
          aria-label={`Edit ${category.name}`}
        >
          Edit
        </Button>
        <Button
          variant="danger"
          onClick={() => onDelete(category)}
          aria-label={`Delete ${category.name}`}
        >
          Delete
        </Button>
      </div>
    </article>
  );
}
