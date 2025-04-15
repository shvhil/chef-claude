import { motion, AnimatePresence } from "framer-motion";

export default function IngredientsList({ items, onRemove }) {
  const ingredientsList = items.map((item) => {
    return (
      <motion.li
        key={item}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -300, transition: { duration: 0.3 } }}
        transition={{ duration: 0.3, type: "spring", stiffness: 90 }}
        layout
        className="ingredient-item"
      >
        <span>{item}</span>
        <button
          className="remove-ingredient-btn"
          onClick={() => onRemove(item)}
          aria-label={`Remove ${item}`}
        >
          &times;
        </button>
      </motion.li>
    );
  });

  return (
    <section className="ingredients-list-section">
      <div className="ingredients-list-container">
        <div className="ingredients-list-subcontainer">
          {items.length > 0 && (
            <h2 className="ingredients-list-title">Ingredients Added</h2>
          )}
          <ul className="ingredients-list">
            <AnimatePresence initial={false}>{ingredientsList}</AnimatePresence>
          </ul>
        </div>
      </div>
    </section>
  );
}
