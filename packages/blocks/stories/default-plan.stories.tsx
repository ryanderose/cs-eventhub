import type { StoryDefault } from '@ladle/react';
import React from 'react';
import { renderBlock } from '../src';

const BLOCK_KEYS = ['block-one', 'block-who', 'block-three'] as const;

export default {
  title: 'Default Blocks/Plan Preview'
} satisfies StoryDefault;

export const Preview = () => (
  <div style={{ display: 'grid', gap: '1rem', maxWidth: '32rem' }}>
    {BLOCK_KEYS.map((key) => (
      <section key={key} style={{ border: '1px solid #d1d5db', padding: '1rem', borderRadius: '0.5rem' }}>
        <strong style={{ display: 'block', marginBottom: '0.5rem', textTransform: 'capitalize' }}>{key.replace(/-/g, ' ')}</strong>
        <div dangerouslySetInnerHTML={{ __html: renderBlock(key) }} />
      </section>
    ))}
  </div>
);
