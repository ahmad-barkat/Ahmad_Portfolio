"use client";

import React, { useEffect, useRef, useMemo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import './ScrollReveal.css';

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealProps {
  children: React.ReactNode;
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
  enableBlur?: boolean;
  baseOpacity?: number;
  baseRotation?: number;
  blurStrength?: number;
  containerClassName?: string;
  textClassName?: string;
  rotationEnd?: string;
  wordAnimationEnd?: string;
  trigger?: 'scroll' | 'mount';
}

const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  scrollContainerRef,
  enableBlur = true,
  baseOpacity = 0.1,
  baseRotation = 3,
  blurStrength = 4,
  containerClassName = '',
  textClassName = '',
  rotationEnd = 'bottom bottom',
  wordAnimationEnd = 'bottom bottom',
  trigger = 'scroll'
}) => {
  const containerRef = useRef<HTMLHeadingElement>(null);
  const triggersRef = useRef<ScrollTrigger[]>([]);

  const splitText = useMemo(() => {
    const text = typeof children === 'string' ? children : '';
    return text.split(/(\s+)/).map((word, index) => {
      if (word.match(/^\s+$/)) return word;
      return (
        <span className="word" key={index}>
          {word}
        </span>
      );
    });
  }, [children]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const scroller = scrollContainerRef && scrollContainerRef.current ? scrollContainerRef.current : window;
    const wordElements = el.querySelectorAll('.word');
    const tweens: gsap.core.Tween[] = [];

    triggersRef.current = [];

    if (trigger === 'mount') {
      gsap.set(el, { transformOrigin: '0% 50%', rotate: baseRotation });
      tweens.push(
        gsap.to(el, { rotate: 0, duration: 0.8, ease: 'power2.out', delay: 0.15 })
      );
      gsap.set(wordElements, { opacity: baseOpacity, willChange: 'opacity' });
      tweens.push(
        gsap.to(wordElements, {
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          stagger: 0.05,
          delay: 0.15
        })
      );
      if (enableBlur) {
        gsap.set(wordElements, { filter: `blur(${blurStrength}px)` });
        tweens.push(
          gsap.to(wordElements, {
            filter: 'blur(0px)',
            duration: 0.8,
            ease: 'power2.out',
            stagger: 0.05,
            delay: 0.15
          })
        );
      }
    } else {
      tweens.push(
        gsap.fromTo(
          el,
          { transformOrigin: '0% 50%', rotate: baseRotation },
          {
            ease: 'none',
            rotate: 0,
            scrollTrigger: {
              trigger: el,
              scroller,
              start: 'top bottom',
              end: rotationEnd,
              scrub: true
            }
          }
        )
      );

      tweens.push(
        gsap.fromTo(
          wordElements,
          { opacity: baseOpacity, willChange: 'opacity' },
          {
            ease: 'none',
            opacity: 1,
            stagger: 0.05,
            scrollTrigger: {
              trigger: el,
              scroller,
              start: 'top bottom-=20%',
              end: wordAnimationEnd,
              scrub: true
            }
          }
        )
      );

      if (enableBlur) {
        tweens.push(
          gsap.fromTo(
            wordElements,
            { filter: `blur(${blurStrength}px)` },
            {
              ease: 'none',
              filter: 'blur(0px)',
              stagger: 0.05,
              scrollTrigger: {
                trigger: el,
                scroller,
                start: 'top bottom-=20%',
                end: wordAnimationEnd,
                scrub: true
              }
            }
          )
        );
      }

      triggersRef.current = ScrollTrigger.getAll().filter(st => st.trigger === el);
    }

    return () => {
      tweens.forEach(tween => tween.kill());
      triggersRef.current.forEach(st => st.kill());
      triggersRef.current = [];
    };
  }, [scrollContainerRef, enableBlur, baseRotation, baseOpacity, rotationEnd, wordAnimationEnd, blurStrength, trigger]);

  return (
    <h2 ref={containerRef} className={`scroll-reveal ${containerClassName}`}>
      <p className={`scroll-reveal-text ${textClassName}`}>{splitText}</p>
    </h2>
  );
};

export default ScrollReveal;
