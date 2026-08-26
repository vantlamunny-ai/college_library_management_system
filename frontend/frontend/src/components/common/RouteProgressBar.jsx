import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './RouteProgressBar.css';

/**
 * A thin gold bar across the very top of the viewport that sweeps in on
 * every route change, no real loader/data-fetch integration behind it
 * (this app doesn't use React Router data loaders), it's a purposeful
 * simulated progress sweep, same trick GitHub/YouTube use, just enough
 * motion to make navigation feel instant and alive instead of a flat cut.
 */
export function RouteProgressBar() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const timers = useRef([]);

  /* eslint-disable react-hooks/set-state-in-effect --
     Kicks off a timed animation sequence in response to a route change,
     an external event this component doesn't control, exactly what
     effects are for. Only re-runs when the path actually changes. */
  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];

    setVisible(true);
    setWidth(15);
    timers.current.push(setTimeout(() => setWidth(65), 90));
    timers.current.push(setTimeout(() => setWidth(88), 260));
    timers.current.push(setTimeout(() => {
      setWidth(100);
      timers.current.push(setTimeout(() => setVisible(false), 280));
    }, 460));

    return () => timers.current.forEach(clearTimeout);
  }, [location.pathname]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div className={`clms-route-bar ${visible ? 'is-visible' : ''}`} style={{ width: `${width}%` }} aria-hidden="true" />
  );
}
