/** Jest sobre módulos ES nativos (ver scripts de package.json). Los tests de DOM usan jsdom por archivo (*.dom.test.js). */
module.exports = {
  testMatch: ["<rootDir>/tests/**/*.test.js"],
  setupFiles: ["<rootDir>/tests/setup.js"],
  collectCoverageFrom: ["js/**/*.js", "!js/pages/**"],
  clearMocks: true,
  restoreMocks: true,
};
