import React from 'react';

/**
 * Context to pass moveAnimationDuration from component to orchestration hook
 * Eliminates need to pass duration as parameter
 */
export const AnimationContext = React.createContext<number>(200);

export const useAnimationDuration = () => {
  const duration = React.useContext(AnimationContext);
  return duration;
};
