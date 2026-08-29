import {env} from '../_generated/server';

const DEFAULT_STRUCTURED_MODEL = 'gpt-5.6-luna';

export function briefModel() {
  return env.OPENAI_MODEL_BRIEF ?? DEFAULT_STRUCTURED_MODEL;
}

export function extractionModel() {
  return env.OPENAI_MODEL_EXTRACTION ?? DEFAULT_STRUCTURED_MODEL;
}
