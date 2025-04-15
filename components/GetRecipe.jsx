import { motion } from "framer-motion";

export default function GetRecipe(props) {
  return (
    <motion.div
      className="call-to-action-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="call-to-action-subcontainer">
        <p> Done adding ingredients? </p>
        <button
          className="generate-btn btn"
          name="generate"
          onClick={props.showSuggests}
        >
          {" "}
          Generate Recipe{" "}
        </button>
      </div>
    </motion.div>
  );
}
