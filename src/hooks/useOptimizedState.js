/**
 * Optimized State Management Hooks
 * Provides performance-optimized state management utilities
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

/**
 * Debounced state hook - prevents excessive re-renders
 */
export const useDebouncedState = (initialValue, delay = 300) => {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  const setDebouncedStateValue = useCallback((newValue) => {
    setValue(newValue);
  }, []);

  return [debouncedValue, setDebouncedStateValue, value];
};

/**
 * Throttled state hook - limits update frequency
 */
export const useThrottledState = (initialValue, limit = 100) => {
  const [value, setValue] = useState(initialValue);
  const [throttledValue, setThrottledValue] = useState(initialValue);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  const setThrottledStateValue = useCallback((newValue) => {
    setValue(newValue);
  }, []);

  return [throttledValue, setThrottledStateValue];
};

/**
 * Optimized object state hook - prevents unnecessary re-renders on object updates
 */
export const useOptimizedObjectState = (initialState) => {
  const [state, setState] = useState(initialState);
  
  const updateState = useCallback((updates) => {
    setState(prevState => {
      // Check if updates actually change the state
      const newState = { ...prevState, ...updates };
      
      // Shallow comparison to prevent unnecessary updates
      const hasChanges = Object.keys(updates).some(key => 
        prevState[key] !== updates[key]
      );
      
      return hasChanges ? newState : prevState;
    });
  }, []);

  const resetState = useCallback(() => {
    setState(initialState);
  }, [initialState]);

  return [state, updateState, resetState];
};

/**
 * Memoized callback hook with dependency optimization
 */
export const useOptimizedCallback = (callback, deps) => {
  const depsRef = useRef(deps);
  const callbackRef = useRef(callback);

  // Only update if dependencies actually changed
  const depsChanged = useMemo(() => {
    if (!depsRef.current || depsRef.current.length !== deps.length) {
      return true;
    }
    
    return deps.some((dep, index) => dep !== depsRef.current[index]);
  }, deps);

  if (depsChanged) {
    depsRef.current = deps;
    callbackRef.current = callback;
  }

  return useCallback(callbackRef.current, deps);
};

/**
 * Previous value hook - useful for comparing state changes
 */
export const usePrevious = (value) => {
  const ref = useRef();
  
  useEffect(() => {
    ref.current = value;
  });
  
  return ref.current;
};

/**
 * Stable reference hook - maintains object reference stability
 */
export const useStableReference = (value) => {
  const ref = useRef(value);
  
  // Only update reference if value actually changed (deep comparison for objects)
  const hasChanged = useMemo(() => {
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(ref.current) !== JSON.stringify(value);
    }
    return ref.current !== value;
  }, [value]);

  if (hasChanged) {
    ref.current = value;
  }

  return ref.current;
};

/**
 * Batched state updates hook - batches multiple state updates
 */
export const useBatchedState = (initialState) => {
  const [state, setState] = useState(initialState);
  const batchedUpdates = useRef([]);
  const timeoutRef = useRef(null);

  const batchUpdate = useCallback((update) => {
    batchedUpdates.current.push(update);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setState(prevState => {
        let newState = prevState;
        
        batchedUpdates.current.forEach(update => {
          if (typeof update === 'function') {
            newState = update(newState);
          } else {
            newState = { ...newState, ...update };
          }
        });

        batchedUpdates.current = [];
        return newState;
      });
    }, 0);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [state, batchUpdate];
};

/**
 * Lazy initial state hook - for expensive initial state calculations
 */
export const useLazyState = (initializer) => {
  const [state, setState] = useState(() => {
    if (typeof initializer === 'function') {
      return initializer();
    }
    return initializer;
  });

  return [state, setState];
};

/**
 * Optimized array state hook - prevents unnecessary re-renders on array operations
 */
export const useOptimizedArrayState = (initialArray = []) => {
  const [array, setArray] = useState(initialArray);

  const addItem = useCallback((item) => {
    setArray(prev => [...prev, item]);
  }, []);

  const removeItem = useCallback((index) => {
    setArray(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateItem = useCallback((index, newItem) => {
    setArray(prev => prev.map((item, i) => i === index ? newItem : item));
  }, []);

  const clearArray = useCallback(() => {
    setArray([]);
  }, []);

  const moveItem = useCallback((fromIndex, toIndex) => {
    setArray(prev => {
      const newArray = [...prev];
      const [movedItem] = newArray.splice(fromIndex, 1);
      newArray.splice(toIndex, 0, movedItem);
      return newArray;
    });
  }, []);

  return {
    array,
    setArray,
    addItem,
    removeItem,
    updateItem,
    clearArray,
    moveItem
  };
};
