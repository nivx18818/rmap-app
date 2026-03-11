export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "body-case": [2, "always", "lower-case"],
    "body-max-line-length": [2, "always", 100],
    "type-case": [2, "always", "lower-case"],
    "scope-case": [2, "always", "lower-case"],
    "subject-case": [2, "always", "lower-case"],
  },
};
