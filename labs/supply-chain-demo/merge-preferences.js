// Illustrates a plausible real-world usage of lodash in an e-commerce app:
// merging a user's saved preferences with request-supplied overrides. This
// script is here for realism/context only - students do NOT need to run or
// exploit it. The actual exercise is running `npm audit` in this directory
// and reading the report. See README.md.
const _ = require("lodash");

const savedPreferences = { theme: "light", currency: "INR", notifications: true };
const requestedOverrides = { currency: "USD" };

const merged = _.merge({}, savedPreferences, requestedOverrides);
console.log("Merged preferences:", merged);
