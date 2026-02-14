import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { ref, onValue, off } from 'firebase/database';

interface CardDesign {
  section_name: string;
  theme: string;
  border_radius?: string;
  border_width?: string;
  border_color?: string;
  shadow?: string;
  bg_color?: string;
  hover_transform?: string;
  image_border_radius?: string;
  button_style?: string;
}

export function useCardDesign(sectionKey: string) {
  const [design, setDesign] = useState<CardDesign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const designRef = ref(db, `card_designs/${sectionKey}`);

    const unsubscribe = onValue(designRef, (snapshot) => {
      if (snapshot.exists()) {
        setDesign(snapshot.val());
      } else {
        setDesign(null);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error loading card design:', error);
      setDesign(null);
      setLoading(false);
    });

    return () => off(designRef, 'value', unsubscribe);
  }, [sectionKey]);

  return { design, loading };
}

export function getCardStyles(design: CardDesign | null) {
  if (!design) {
    return {
      container: 'rounded-2xl border-2 border-teal-200 shadow-md',
      image: 'rounded-xl',
      button: 'rounded-xl',
      style: {},
      imageStyle: {},
      hoverTransform: 'translateY(-0.5rem)'
    };
  }

  const containerStyle: React.CSSProperties = {};

  if (design.border_radius) containerStyle.borderRadius = design.border_radius;
  if (design.border_width) containerStyle.borderWidth = design.border_width;
  if (design.border_color) containerStyle.borderColor = design.border_color;
  if (design.border_width || design.border_color) containerStyle.borderStyle = 'solid';
  if (design.shadow) containerStyle.boxShadow = design.shadow;
  if (design.bg_color) containerStyle.backgroundColor = design.bg_color;

  const imageStyle: React.CSSProperties = {};
  if (design.image_border_radius) imageStyle.borderRadius = design.image_border_radius;

  return {
    container: '',
    image: '',
    button: design.button_style || 'rounded-xl',
    style: containerStyle,
    imageStyle: imageStyle,
    hoverTransform: design.hover_transform || ''
  };
}
