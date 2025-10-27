export default {
  stories: './packages/blocks/src/**/*.stories.@(ts|tsx)',
  viteConfig: {
    resolve: {
      alias: {
        react: 'react',
        'react-dom': 'react-dom'
      }
    }
  }
};
