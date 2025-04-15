import { useState, useEffect } from "react";
import { motion } from "framer-motion";

// --- Hugging Face Config ---
const HF_API_KEY = import.meta.env.VITE_HUGGING_FACE_API_KEY;
const API_URL =
  "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1"; // Or choose another suitable model
// --- End Hugging Face Config ---

function parseRecipeResponse(text) {
  const recipe = {
    title: "Generated Recipe",
    description: "",
    ingredients: [],
    instructions: [],
  };

  const lines = text.split("\n");
  let currentSection = null;

  const titleMatch = text.match(/^Title:\s*(.*)/im);
  if (titleMatch) recipe.title = titleMatch[1].trim();

  const descMatch = text.match(/^Description:\s*(.*)/im);
  if (descMatch) recipe.description = descMatch[1].trim();
  else {
    const firstSentence = text.split(".")[0];
    if (firstSentence && firstSentence.length < 150) {
      recipe.description = firstSentence.trim() + ".";
    }
  }

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    if (trimmedLine.match(/^Ingredients:/i)) {
      currentSection = "ingredients";
      continue;
    } else if (trimmedLine.match(/^Instructions:/i)) {
      currentSection = "instructions";
      continue;
    }

    if (
      currentSection === "ingredients" &&
      (trimmedLine.startsWith("-") ||
        trimmedLine.startsWith("*") ||
        /^[0-9]+\./.test(trimmedLine))
    ) {
      recipe.ingredients.push(trimmedLine.replace(/^[-*0-9.]+\s*/, "").trim());
    } else if (
      currentSection === "instructions" &&
      (trimmedLine.startsWith("-") ||
        trimmedLine.startsWith("*") ||
        /^[0-9]+\./.test(trimmedLine))
    ) {
      recipe.instructions.push(trimmedLine.replace(/^[-*0-9.]+\s*/, "").trim());
    }
  }

  if (recipe.ingredients.length === 0) {
    recipe.ingredients = [`Could not parse ingredients from response.`];
  }
  if (recipe.instructions.length === 0) {
    recipe.instructions = [
      `Could not parse instructions from response. Raw output below:`,
      text,
    ];
    if (!recipe.description)
      recipe.description = "Model generated text, couldn't fully parse."; // Adjust description if needed
  }

  return recipe;
}

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export default function ClaudeRecipe({ ingredients, key: regenerateKey }) {
  const [recipe, setRecipe] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ingredients || ingredients.length < 4) {
      setRecipe(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const fetchRecipe = async () => {
      setIsLoading(true);
      setError(null);
      setRecipe(null);

      if (!HF_API_KEY) {
        setError("Hugging Face API Key not configured.");
        setIsLoading(false);
        return;
      }

      const ingredientsString = ingredients.join(", ");

      const prompt = `You are Chef Claude, an inventive and sometimes eccentric chef assistant. Create a recipe, however strange, using ONLY the following ingredients: ${ingredientsString}.

IMPORTANT: You MUST format the output EXACTLY like this, including all section titles, even if the recipe is unusual:

Title: [Give the recipe a creative, fitting title]
Description: [Write a short, engaging description of this unique dish]
Ingredients:
- [List each provided ingredient, perhaps with a made-up quantity or simple prep note]
...
Instructions:
1. [Provide step-by-step instructions, even if they seem nonsensical for the ingredients]
2. [Continue the steps]
...

Ensure ALL sections (Title, Description, Ingredients, Instructions) are present in your response. Do not omit any section.`;

      console.log("Sending prompt to Hugging Face:", prompt);

      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${HF_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              max_new_tokens: 500,
              temperature: 0.7,
              return_full_text: false,
            },
          }),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          console.error("API Error Response:", errorBody);
          throw new Error(
            `API request failed: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        console.log("API Response Data:", data);

        let parsedRecipe = null;
        if (data && data[0] && data[0].generated_text) {
          parsedRecipe = parseRecipeResponse(data[0].generated_text);
        } else {
          throw new Error("Invalid or empty response format from API");
        }

        // --- Post-Parsing Validation and Fallbacks ---
        if (!parsedRecipe) {
          // Should not happen if previous check passes, but safeguard
          parsedRecipe = {
            title: "Error",
            description: "Failed to get data.",
            ingredients: [],
            instructions: [],
          };
        }

        // Ensure essential fields have content, providing defaults if missing after parsing
        if (
          !parsedRecipe.title?.trim() ||
          parsedRecipe.title === "Generated Recipe"
        ) {
          // Check for empty or default parser title
          parsedRecipe.title = `An Unusual Dish with ${ingredientsString.substring(
            0,
            20
          )}...`;
        }
        if (!parsedRecipe.description?.trim()) {
          parsedRecipe.description = `Chef Claude's creation using the provided ingredients. Results may vary!`;
        }
        if (
          !parsedRecipe.ingredients ||
          parsedRecipe.ingredients.length === 0 ||
          parsedRecipe.ingredients[0].includes("Could not parse")
        ) {
          parsedRecipe.ingredients = ingredients.map(
            (ing) => `- ${ing} (quantity unknown)`
          ); // Use original ingredients as fallback
          parsedRecipe.ingredients.push("- Parsed ingredients unavailable.");
        }
        if (
          !parsedRecipe.instructions ||
          parsedRecipe.instructions.length === 0 ||
          parsedRecipe.instructions[0].includes("Could not parse")
        ) {
          parsedRecipe.instructions = [
            "1. Inspect the ingredients carefully.",
            "2. Combine them in a surprising way.",
            "3. Apply heat (or not).",
            "4. Serve with confidence!",
            "(Parsed instructions unavailable)",
          ];
        }
        // --- End Fallbacks ---

        setRecipe(parsedRecipe);
      } catch (error) {
        console.error("Error fetching recipe:", error);
        // Provide a structured error in the recipe display itself
        setRecipe({
          title: "Recipe Generation Failed",
          description: `Chef Claude encountered an error: ${error.message}`,
          ingredients: ["- Error retrieving ingredients"],
          instructions: [
            "1. Please check the console for details.",
            "2. Try regenerating or resetting the list.",
          ],
        });
        // Optionally set a separate error state too if needed for different UI
        // setError(`Failed to fetch recipe: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    const timerId = setTimeout(() => {
      fetchRecipe();
    }, 300);

    return () => clearTimeout(timerId);
  }, [ingredients, regenerateKey]); // Add regenerateKey dependency

  if (isLoading) {
    return (
      <motion.section
        className="recipe-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2>Generating Recipe...</h2>
        <p>Chef Claude is thinking...</p>
        {/* Optional: Add a loading spinner here */}
      </motion.section>
    );
  }

  if (error) {
    // Show error if one exists
    return (
      <motion.section
        className="recipe-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2>Oops!</h2>
        <motion.p initial="hidden" animate="visible" variants={itemVariants}>
          {error}
        </motion.p>
      </motion.section>
    );
  }

  // Show placeholder only if not loading, no error, and no recipe yet
  if (!recipe && !isLoading && !error) {
    return (
      <motion.section
        className="recipe-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2>Chef Claude Recommends:</h2>
        <motion.p initial="hidden" animate="visible" variants={itemVariants}>
          Add ingredients and click Generate!
        </motion.p>
      </motion.section>
    );
  }

  // Render the actual recipe if available
  if (recipe) {
    return (
      <motion.section
        className="recipe-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.h2 initial="hidden" animate="visible" variants={itemVariants}>
          Chef Claude Recommends: {recipe.title}
        </motion.h2>

        <motion.article
          className="recipe-content"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.p variants={itemVariants}>{recipe.description}</motion.p>

          <motion.h3 variants={itemVariants}>Ingredients:</motion.h3>
          <motion.ul variants={itemVariants}>
            {recipe.ingredients.map((ing, index) => (
              <motion.li key={index} variants={itemVariants}>
                {ing}
              </motion.li>
            ))}
          </motion.ul>

          <motion.strong variants={itemVariants}>Instructions:</motion.strong>
          <motion.ol variants={itemVariants}>
            {recipe.instructions.map((step, index) => (
              <motion.li key={index} variants={itemVariants}>
                {step}
              </motion.li>
            ))}
          </motion.ol>
        </motion.article>
      </motion.section>
    );
  }

  // Fallback case (should ideally not be reached often with the logic above)
  return null;
}
