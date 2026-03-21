import react from 'eslint-plugin-react';
import perfectionist from 'eslint-plugin-perfectionist';

/**
 * A shared ESLint configuration for JSX.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const jsxConfig = [
  {
    plugins: { react },
    rules: {
      'react/function-component-definition': [
        'warn',
        {
          namedComponents: 'function-declaration',
          unnamedComponents: 'arrow-function',
        },
      ],
      'react/hook-use-state': ['warn', { allowDestructuredState: true }],
      'react/jsx-boolean-value': 'warn',
      'react/jsx-curly-brace-presence': [
        'warn',
        {
          props: 'never',
          children: 'never',
          propElementValues: 'always',
        },
      ],
      'react/jsx-fragments': 'warn',
      'react/jsx-handler-names': 'warn',
      'react/jsx-no-constructed-context-values': 'warn',
      'react/jsx-no-useless-fragment': ['warn', { allowExpressions: true }],
      'react/jsx-pascal-case': 'warn',
      'react/no-namespace': 'warn',
      'react/self-closing-comp': 'warn',
      'react/void-dom-elements-no-children': 'warn',
    },
  },
  {
    plugins: {
      perfectionist,
    },
    rules: {
      'perfectionist/sort-jsx-props': [
        'warn',
        {
          type: 'unsorted',

          groups: [
            'react',

            'identity',
            'polymorphism',

            'variant',
            'styling',

            'link',
            'navigation',
            'media',
            'media-behavior',
            'form',

            'a11y-role',
            'a11y-aria',
            'a11y-tabindex',

            'layout',

            'motion',
            'motion-gesture',
            'motion-layout',

            'data',
            'ref',
            'content',
            'children',
            'unknown',
            'shorthand',
            'controlled',
            'callback',
          ],

          customGroups: [
            {
              groupName: 'react',
              elementNamePattern: '^(key|ref)$',
            },
            {
              groupName: 'identity',
              elementNamePattern: '^(id|name)$',
            },
            {
              groupName: 'polymorphism',
              elementNamePattern: '^(as|asChild|forwardedAs|slot)$',
            },
            {
              groupName: 'variant',
              elementNamePattern: '^(variant|size|color|intent)$',
            },
            {
              groupName: 'styling',
              elementNamePattern: '^(className|style|tw|css|sx)$',
            },
            {
              groupName: 'data',
              elementNamePattern: '^data-',
            },
            {
              groupName: 'a11y-role',
              elementNamePattern: '^role$',
            },
            {
              groupName: 'a11y-aria',
              elementNamePattern: '^aria-',
            },
            {
              groupName: 'a11y-tabindex',
              elementNamePattern: '^tabIndex$',
            },
            {
              groupName: 'link',
              elementNamePattern: '^(href|target|rel|download)$',
            },
            {
              groupName: 'navigation',
              elementNamePattern: '^(replace|scroll|prefetch)$',
            },
            {
              groupName: 'media',
              elementNamePattern:
                '^(src|alt|srcSet|sizes|fill|priority|quality|placeholder|blurDataURL|loading)$',
            },
            {
              groupName: 'form',
              elementNamePattern:
                '^(type|placeholder|readOnly|disabled|required|multiple|min.*|max.*|step|pattern|inputMode|autoComplete)$',
            },
            {
              groupName: 'media-behavior',
              elementNamePattern: '^(controls|autoPlay|loop|muted|playsInline)$',
            },
            {
              groupName: 'content',
              elementNamePattern: '^(title|label)$',
            },
            {
              groupName: 'layout',
              elementNamePattern: '^(width|height|cols|rows)$',
            },
            {
              groupName: 'ref',
              elementNamePattern: '^innerRef$',
            },
            {
              groupName: 'children',
              elementNamePattern: '^(children|dangerouslySetInnerHTML)$',
            },
            {
              groupName: 'motion',
              elementNamePattern: '^(initial|animate|exit|variants)$',
            },
            {
              groupName: 'motion-gesture',
              elementNamePattern: '^(whileHover|whileTap|whileFocus|whileDrag)$',
            },
            {
              groupName: 'motion-layout',
              elementNamePattern: '^(transition|layout|layoutId)$',
            },
            {
              groupName: 'shorthand',
              elementNamePattern: '^(autoFocus|draggable|spellCheck|translate|hidden)$',
            },
            {
              groupName: 'controlled',
              elementNamePattern: '^(value|defaultValue|checked|defaultChecked|open|selected)$',
            },
            {
              groupName: 'callback',
              elementNamePattern:
                '^on(Accept|Change|OpenChange|ValueChange|CheckedChange|Select|Close|Submit|Click)',
            },
          ],
        },
      ],
    },
  },
];
