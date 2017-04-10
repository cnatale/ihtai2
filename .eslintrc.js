module.exports = {
  "extends": "eslint:recommended",
  "plugins": [
      "filenames",
      "mocha"
  ],
  "env": {
    "es6": true,
    "node": true
  },
  "rules": {
    // files should be in kebab-style. All lowercase.
    "filenames/match-regex": [2, "^[\\.a-z0-9\\-]+$", true],
    "indent": [
      2,
      2,
      { "SwitchCase": 1, "MemberExpression": 1 }
    ],
    "quotes": [
      2,
      "single"
    ],
    "linebreak-style": [
      2,
      "unix"
    ],
    "semi": [
      2,
      "always"
    ],
    "brace-style": [
      2,
      "1tbs",
      { "allowSingleLine": true }
    ],
    "keyword-spacing": 2,
    "comma-spacing": 2,
    "no-console": 2,
    "no-constant-condition": 2,
    "no-debugger": 2,
    "mocha/no-exclusive-tests": 1,
    "no-extra-boolean-cast": 0,
    "no-invalid-regexp": 2,
    "no-irregular-whitespace": 2,
    "no-nested-ternary": 2,
    "use-isnan": 2,
    "valid-typeof": 2,
    "no-unreachable": 2,
    "no-regex-spaces": 1,
    "block-scoped-var": 1,
    "complexity": [1, 8],
    "curly": 2,
    "default-case": 2,
    "dot-notation": 1,
    "eqeqeq": 2,
    "no-mixed-spaces-and-tabs": 2,
    "no-spaced-func": 2,
    "space-before-blocks": 2,
    "space-in-brackets": 0,
    "space-in-parens": 0,
    "space-infix-ops": 2,
    "spaced-comment": 2,
    "object-curly-spacing": [2, 'always'],
     ////////////////ES6 RULES///////////////////////////////////////////////
    // require braces in arrow function body
    "arrow-body-style": 0,
    // require parens in arrow function arguments
    "arrow-parens": 2,
    // require space before/after arrow functions arrow
    "arrow-spacing": 2,
    // verify super() callings in constructors
    "constructor-super": 2,
    // enforce the spacing around the * in generator functions
    "generator-star-spacing": 2,
    // disallow arrow functions where a condition is expected
    "no-confusing-arrow": 2,
    // disallow modifying variables of class declarations
    "no-class-assign": 2,
    // disallow modifying variables that are declared using const
    "no-const-assign": 2,
    // disallow duplicate name in class members
    "no-dupe-class-members": 2,
    // disallow to use this/super before super() calling in constructors.
    "no-this-before-super": 2,
    // require let or const instead of var
    "no-var": 2,
    // require method and property shorthand syntax for object literals
    "object-shorthand": 2,
    // suggest using arrow functions as callbacks
    "prefer-arrow-callback": 0,
    // suggest using of const declaration for variables that are never modified after declared
    "prefer-const": 2,
    // suggest using Reflect methods where applicable
    "prefer-reflect": 0,
    // suggest using the spread operator instead of .apply()
    "prefer-spread": 2,
    // suggest using template literals instead of strings concatenation
    "prefer-template": 0,
    // disallow generator functions that do not have yield
    "require-yield": 2
  }
};
