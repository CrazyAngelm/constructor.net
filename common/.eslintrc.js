module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	plugins: [ '@typescript-eslint' ],
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/eslint-recommended',
		'plugin:@typescript-eslint/recommended',
		'prettier',
	],
	rules: {
		'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
		'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',

		'camelcase': [ 'warn', { 'properties': 'always' } ],

		'eqeqeq': [ 'error', 'smart' ],
		'no-var': [ 'error' ],
		'space-before-function-paren': [ 'error', {
			'anonymous': 'never',
			'named': 'never',
			'asyncArrow': 'always',
		} ],

		'@typescript-eslint/interface-name-prefix': 'off',
		'@typescript-eslint/explicit-function-return-type': 'off',
		'@typescript-eslint/explicit-module-boundary-types': 'off',
		'@typescript-eslint/no-explicit-any': 'error',
		'@typescript-eslint/no-unused-var': 'off',
		'prefer-const': 'warn',

		'array-bracket-newline': [ 'error', 'consistent' ],
		'array-bracket-spacing': [ 'warn', 'always' ],
		'arrow-parens': [ 'error', 'as-needed', { 'requireForBlockBody': true } ],
		'arrow-spacing': [ 'error', { before: true, after: true } ],
		'block-spacing': [ 'error', 'always' ],
		'brace-style': [ 'error', '1tbs', { allowSingleLine: true } ],

		'comma-dangle': [ 'error', 'always-multiline' ],
		'comma-spacing': [ 'error', { before: false, after: true } ],
		'comma-style': [ 'error', 'last' ],

		'computed-property-spacing': [ 'error', 'never' ],

		'dot-location': [ 'error', 'property' ],

		'eol-last': [ 'error', 'always' ],

		'func-call-spacing': [ 'error', 'never' ],
		'function-call-argument-newline': [ 'warn', 'consistent' ],
		'function-paren-newline': [ 'error', 'consistent' ],

		'generator-star-spacing': [ 'error', { before: false, after: true } ],
		'implicit-arrow-linebreak': [ 'error', 'beside' ],

		'indent': [ 'error', 'tab', {
			SwitchCase: 0,
		} ],

		'no-mixed-spaces-and-tabs': [ 'error', 'smart-tabs' ],

		'jsx-quotes': [ 'error', 'prefer-double' ],

		'no-trailing-spaces': 'error',

		'quotes': [ 'error', 'single' ],

		'semi': [ 'error', 'never' ],

		'operator-linebreak': [ 'error', 'before' ],
	},
}
