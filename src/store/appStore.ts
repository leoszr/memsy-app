import {
  CardRepository,
  openMemsyDatabase,
  SettingsRepository,
  TrainingRepository,
} from '../db';
import { configureDefaultTranslationService } from '../services/TranslationService';
import { configureMemsyStore, MemsyStore } from './useMemsyStore';

let bootPromise: Promise<MemsyStore> | null = null;

export function bootstrapMemsyStore(): Promise<MemsyStore> {
  if (!bootPromise) {
    bootPromise = openMemsyDatabase()
      .then((db) => {
        configureDefaultTranslationService(db);
        return configureMemsyStore({
          cards: new CardRepository(db),
          settings: new SettingsRepository(db),
          training: new TrainingRepository(db),
        });
      })
      .catch((error) => {
        bootPromise = null;
        throw error;
      });
  }
  return bootPromise;
}
