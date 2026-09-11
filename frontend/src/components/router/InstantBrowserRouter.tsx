import React, { useLayoutEffect, useRef, useState } from "react";
import {
  Router,
  UNSAFE_createBrowserHistory as createBrowserHistory,
} from "react-router-dom";

export interface InstantBrowserRouterProps {
  basename?: string;
  children?: React.ReactNode;
  window?: Window;
}

/**
 * InstantBrowserRouter:
 * Replaces React Router v7's default BrowserRouter which forces state updates
 * inside React.startTransition.
 *
 * In React 19, transitions on lazy components suppress Suspense fallbacks on existing
 * trees and hold the previous view frozen on screen until chunks download over the network.
 *
 * InstantBrowserRouter commits history state updates immediately and synchronously:
 * 1. Active nav links update immediately in the next animation frame.
 * 2. Route transitions begin instantly with zero dead period.
 * 3. Localized Suspense fallbacks (skeletons) appear immediately if code/data is pending.
 */
export function InstantBrowserRouter({
  basename,
  children,
  window: windowContext,
}: InstantBrowserRouterProps) {
  const historyRef = useRef<ReturnType<typeof createBrowserHistory> | null>(null);

  if (historyRef.current == null) {
    historyRef.current = createBrowserHistory({
      window: windowContext,
      v5Compat: true,
    });
  }

  const history = historyRef.current;

  const [state, setState] = useState({
    action: history.action,
    location: history.location,
  });

  useLayoutEffect(() => {
    // Immediate, urgent state update without wrapping in React.startTransition
    return history.listen((newState) => {
      setState(newState);
    });
  }, [history]);

  return (
    <Router
      basename={basename}
      location={state.location}
      navigationType={state.action}
      navigator={history}
    >
      {children}
    </Router>
  );
}

export default InstantBrowserRouter;
