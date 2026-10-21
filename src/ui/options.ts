/** Whether the controls and settings dialog is open over the start screen (presentation state: the start controller opens it, the pause controller shows it). */
import { createSignal } from '@gameengine/ui';

export const [optionsOpen, setOptionsOpen] = createSignal(false);
