const common = require('../common/.eslintrc.js')

module.exports = {
	...common,
	root: true,
	parser: require.resolve('@typescript-eslint/parser'),
	extends: [
		'next/core-web-vitals',
		'eslint:recommended',
		'plugin:@typescript-eslint/eslint-recommended',
		'plugin:@typescript-eslint/recommended',
		'prettier',
	],
	rules: {
		...common.rules,
		'@typescript-eslint/no-unused-vars': [ 'warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' } ],
		'@typescript-eslint/no-unused-expressions': 'warn',
		'arrow-parens': 'off',
		'implicit-arrow-linebreak': 'off',
		'indent': 'off',
	},
	overrides: [
		{
			files: [ '*.js' ],
			rules: { '@typescript-eslint/no-require-imports': 'off' },
		},
	],
}
