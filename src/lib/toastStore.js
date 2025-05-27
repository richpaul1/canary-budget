import { writable } from 'svelte/store';

// Create a writable store
const createToastStore = () => {
  // Initial state: no active toasts
  const { subscribe, update } = writable([]);
  
  // Generate a unique ID for each toast
  const generateId = () => `toast-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  return {
    subscribe,
    // Add a new toast
    show: (message, type = 'info', duration = 3000) => {
      const id = generateId();
      
      // Add toast to the store
      update(toasts => [
        ...toasts, 
        { id, message, type, duration }
      ]);
      
      // Automatically remove the toast after duration
      setTimeout(() => {
        update(toasts => toasts.filter(t => t.id !== id));
      }, duration);
    },
    // Remove a specific toast
    remove: (id) => {
      update(toasts => toasts.filter(t => t.id !== id));
    },
    // Clear all toasts
    clear: () => {
      update(() => []);
    }
  };
};

// Export the store
export const toast = createToastStore();