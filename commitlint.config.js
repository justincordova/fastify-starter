export default {
  extends: ["@commitlint/config-conventional"],
  // Allow the conventional first commit of a new repository
  ignores: [(message) => message.trim() === "Initial commit"],
};
