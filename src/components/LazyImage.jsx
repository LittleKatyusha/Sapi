/**
 * Lazy Loading Image Component
 * Optimized image loading with intersection observer
 */

import React, { useState, useRef, useEffect } from 'react';
import performanceMonitor from '../utils/performanceMonitor';

const LazyImage = ({
  src,
  alt,
  placeholder = '/api/placeholder/400/300',
  className = '',
  style = {},
  onLoad,
  onError,
  threshold = 0.1,
  rootMargin = '50px',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    const currentImg = imgRef.current;
    if (!currentImg) return;

    // Create intersection observer
    observerRef.current = performanceMonitor.setupIntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            // Stop observing once image is in view
            if (observerRef.current) {
              observerRef.current.unobserve(entry.target);
            }
          }
        });
      },
      {
        threshold,
        rootMargin
      }
    );

    if (observerRef.current) {
      observerRef.current.observe(currentImg);
    }

    return () => {
      if (observerRef.current && currentImg) {
        observerRef.current.unobserve(currentImg);
      }
    };
  }, [threshold, rootMargin]);

  const handleLoad = (event) => {
    setIsLoaded(true);
    if (onLoad) {
      onLoad(event);
    }
  };

  const handleError = (event) => {
    setHasError(true);
    if (onError) {
      onError(event);
    }
  };

  const imageStyle = {
    transition: 'opacity 0.3s ease-in-out',
    opacity: isLoaded ? 1 : 0,
    ...style
  };

  const placeholderStyle = {
    ...style,
    opacity: isLoaded ? 0 : 1,
    position: isLoaded ? 'absolute' : 'static',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'opacity 0.3s ease-in-out'
  };

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ position: 'relative' }}
    >
      {/* Placeholder image */}
      {!isLoaded && !hasError && (
        <img
          src={placeholder}
          alt=""
          style={placeholderStyle}
          className="blur-sm"
        />
      )}
      
      {/* Main image - only load when in view */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          style={imageStyle}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
      
      {/* Error state */}
      {hasError && (
        <div 
          className="flex items-center justify-center bg-gray-200 text-gray-500"
          style={style}
        >
          <span className="text-sm">Failed to load image</span>
        </div>
      )}
      
      {/* Loading indicator */}
      {isInView && !isLoaded && !hasError && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-gray-100"
          style={{ zIndex: 1 }}
        >
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default LazyImage;
