import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GetRecipe from "./GetRecipe";
import IngredientsList from "./IngredientsList";
import ClaudeRecipe from "./ClaudeRecipe";

export default function Main() {
  const [ingredients, setIngredients] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [regenerateCounter, setRegenerateCounter] = useState(0);

  function handleSubmit(formData, event) {
    const newIngredient = formData.get("new-ingredient").trim();
    if (newIngredient && !ingredients.includes(newIngredient)) {
      setIngredients((prevIngredients) => [...prevIngredients, newIngredient]);
    }
    const form = event.target;
    form.reset();
  }

  function removeIngredient(ingredientToRemove) {
    setIngredients((prevIngredients) =>
      prevIngredients.filter((item) => item !== ingredientToRemove)
    );
  }

  function toggleClaude() {
    if (ingredients.length > 3) {
      setRegenerateCounter(0);
      setShowSuggestions(true);
    }
  }

  function resetList() {
    setIngredients([]);
    setShowSuggestions(false);
  }

  function regenerateRecipe() {
    if (ingredients.length > 3) {
      setRegenerateCounter((prev) => prev + 1);
    } else {
      alert("Please add at least 4 ingredients to regenerate.");
    }
  }

  return (
    <main className={`main-content-area`}>
      <AnimatePresence mode="wait">
        {showSuggestions ? (
          <motion.div
            key="split-view"
            className="split-view-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="left-column"
              layout
              transition={{ duration: 0.5, type: "spring", stiffness: 80 }}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit(new FormData(e.target), e);
                }}
                method="get"
                className="add-ingredient-form"
              >
                <input
                  className="ingredient-input"
                  aria-label="Add Ingredient"
                  placeholder="Add another?"
                  name="new-ingredient"
                  autoFocus
                />
                <button type="submit" className="ingredient-submit-btn btn">
                  + Add
                </button>
              </form>
              <IngredientsList
                items={ingredients}
                onRemove={removeIngredient}
              />
              <div className="list-actions">
                <button
                  onClick={regenerateRecipe}
                  className="btn regenerate-btn"
                >
                  Regenerate Recipe
                </button>
                <button onClick={resetList} className="btn reset-btn">
                  Reset List
                </button>
              </div>
            </motion.div>

            <motion.div
              className="right-column"
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <ClaudeRecipe ingredients={ingredients} key={regenerateCounter} />
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="initial-view"
            className="initial-view-container"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(new FormData(e.target), e);
              }}
              method="get"
              className="add-ingredient-form"
            >
              <input
                className="ingredient-input"
                aria-label="Add Ingredient"
                placeholder="eg. oregano"
                name="new-ingredient"
                autoFocus
                required
              />
              <button type="submit" className="ingredient-submit-btn btn">
                + Add Ingredient
              </button>
            </form>
            <IngredientsList items={ingredients} onRemove={removeIngredient} />
            {ingredients.length > 3 ? (
              <GetRecipe showSuggests={toggleClaude} />
            ) : undefined}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
