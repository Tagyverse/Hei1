/**
 * Smooth Interactions Utility
 * Provides smooth scrolling, animations, and transitions
 */

// Smooth scroll to element
export const smoothScrollTo = (element: Element, offset: number = 0) => {
  const yOffset = -offset;
  const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;

  window.scrollTo({
    top: y,
    behavior: 'smooth'
  });
};

// Smooth scroll to ID
export const smoothScrollToId = (id: string, offset: number = 0) => {
  const element = document.getElementById(id);
  if (element) {
    smoothScrollTo(element, offset);
  }
};

// Smooth page transitions with fade
export const fadeInElement = (element: Element, duration: number = 300) => {
  element.classList.add('animate-fade-in');
  (element as HTMLElement).style.animationDuration = `${duration}ms`;
};

// Batch animate multiple elements
export const staggerAnimate = (
  elements: Element[],
  animationClass: string,
  staggerDelay: number = 100
) => {
  elements.forEach((element, index) => {
    setTimeout(() => {
      element.classList.add(animationClass);
    }, index * staggerDelay);
  });
};

// Smooth scroll snap
export const enableSmoothScrollSnap = () => {
  const style = document.createElement('style');
  style.textContent = `
    html {
      scroll-behavior: smooth;
      scroll-snap-type: y proximity;
    }
    
    main > section {
      scroll-snap-align: start;
      scroll-snap-stop: always;
    }
  `;
  document.head.appendChild(style);
};

// Parallax effect helper
export const createParallaxEffect = (element: Element, speed: number = 0.5) => {
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const elementOffset = (element as HTMLElement).offsetTop;
    const distance = scrollY - elementOffset;
    
    if (distance > -window.innerHeight && distance < window.innerHeight) {
      (element as HTMLElement).style.transform = `translateY(${distance * speed}px)`;
    }
  });
};

// Intersection Observer for smooth reveal on scroll
export const revealOnScroll = (selector: string, animationClass: string = 'animate-fade-in') => {
  const elements = document.querySelectorAll(selector);
  
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add(animationClass);
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    }
  );

  elements.forEach(element => observer.observe(element));
  return observer;
};

// Smooth page load animation
export const smoothPageLoad = () => {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes page-fade-in {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    main {
      animation: page-fade-in 0.6s ease-out;
    }
  `;
  document.head.appendChild(style);
};

// Smooth hover effects
export const addSmoothHoverEffect = (selector: string) => {
  const elements = document.querySelectorAll(selector);
  
  elements.forEach(element => {
    (element as HTMLElement).addEventListener('mouseenter', () => {
      (element as HTMLElement).style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    });
  });
};

// Scroll to top smoothly
export const scrollToTopSmooth = (duration: number = 300) => {
  const startPosition = window.pageYOffset;
  const startTime = performance.now();

  const ease = (t: number) => {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  };

  const scroll = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease_value = ease(progress);
    
    window.scrollTo(0, startPosition * (1 - ease_value));

    if (progress < 1) {
      requestAnimationFrame(scroll);
    }
  };

  requestAnimationFrame(scroll);
};

// Smooth modal transitions
export const smoothModalTransition = (isOpen: boolean, element: HTMLElement) => {
  if (isOpen) {
    element.classList.add('animate-scale-in');
    element.style.display = 'block';
  } else {
    element.classList.remove('animate-scale-in');
    setTimeout(() => {
      element.style.display = 'none';
    }, 300);
  }
};

// Intersection observer for smooth counter animation
export const animateCounter = (element: HTMLElement, targetNumber: number, duration: number = 2000) => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !element.classList.contains('counted')) {
          let currentNumber = 0;
          const increment = targetNumber / (duration / 16);
          
          const counter = setInterval(() => {
            currentNumber += increment;
            if (currentNumber >= targetNumber) {
              currentNumber = targetNumber;
              clearInterval(counter);
            }
            element.textContent = Math.floor(currentNumber).toString();
          }, 16);
          
          element.classList.add('counted');
          observer.unobserve(element);
        }
      });
    },
    { threshold: 0.5 }
  );

  observer.observe(element);
};

// Smooth drawer/sidebar transitions
export const smoothDrawerTransition = (isOpen: boolean, drawer: HTMLElement) => {
  const backdrop = document.querySelector('[data-drawer-backdrop]');
  
  if (isOpen) {
    drawer.style.transform = 'translateX(0)';
    if (backdrop) backdrop.classList.add('opacity-100');
  } else {
    drawer.style.transform = 'translateX(-100%)';
    if (backdrop) backdrop.classList.remove('opacity-100');
  }
};

export default {
  smoothScrollTo,
  smoothScrollToId,
  fadeInElement,
  staggerAnimate,
  enableSmoothScrollSnap,
  createParallaxEffect,
  revealOnScroll,
  smoothPageLoad,
  addSmoothHoverEffect,
  scrollToTopSmooth,
  smoothModalTransition,
  animateCounter,
  smoothDrawerTransition
};
