export default {
  stories: './packages/blocks/src/**/*.stories.@(ts|tsx)',
  options: {
    runOnly: {
      type: 'tag',
      values: ['wcag2aa']
    }
  }
};
