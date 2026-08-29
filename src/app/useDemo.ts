import {useContext} from 'react';
import {DemoContext} from './demoContextCore';

export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error('useDemo must be used inside DemoProvider.');
  return value;
}
